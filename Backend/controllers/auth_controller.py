import os
import bcrypt
from datetime import datetime, timezone
from typing import Optional

from models.auth import (
    fetch_user_for_login,
    check_email_exists,
    check_license_exists,
    fetch_role_id_by_name,
    insert_pending_user,
    insert_pending_physician,
    update_rejected_user_to_pending,
    fetch_user_by_google_id,
    fetch_user_by_email_google,
    link_google_account,
    insert_google_user,
    fetch_user_by_id_complete,
    fetch_physician_id_by_user
)
from models.hospital import fetch_hospital_by_id
from utils.audit import log_action

JWT_SECRET = os.getenv("JWT_SECRET", "hrs-dev-secret-change-in-prod")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _build_user_dict(row, physician_id: str | None = None) -> dict:
    """Shared helper to build a user dict from a DB row."""
    d = {
        "id": str(row["user_id"]),
        "email": row["email"],
        "first_name": row.get("first_name", ""),
        "last_name": row.get("last_name", ""),
        "full_name": row.get("full_name", ""),
        "role": row.get("role_name", ""),
        "hospital_id": str(row["hospital_id"]) if row.get("hospital_id") else None,
        "phone_number": row.get("phone_number"),
        "status": row["status"],
        "physician_id": physician_id,
        "auth_provider": row.get("auth_provider", "local"),
        "profile_picture_url": row.get("profile_picture_url"),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        # Hospital details (from LEFT JOIN hospitals)
        "hospital_name": row.get("hospital_name"),
        "hospital_address": row.get("hospital_address"),
        "contact_phone": row.get("contact_phone"),
        # Physician professional details (from LEFT JOIN physicians)
        "title": row.get("title"),
        "license_number": row.get("license_number"),
        "specialization": row.get("specialization"),
        "department": row.get("department"),
        "grade": row.get("grade"),
    }
    return d


def process_login(email: str, password: str) -> dict:
    row = fetch_user_for_login(email)
    
    if not row:
        return {"error": True, "code": 401, "message": "Invalid email or password"}

    # Security check: if the user signed up with Google, they shouldn't have a local password.
    # We force them to use the "Sign in with Google" button to prevent account takeovers.
    if row["auth_provider"] == "google" and not row["password_hash"]:
        return {
            "error": True, 
            "code": 401, 
            "message": "This account uses Google Sign-In. Please use Google to log in."
        }

    if not verify_password(password, row["password_hash"]):
        return {"error": True, "code": 401, "message": "Invalid email or password"}

    if row["status"] == "pending":
        return {"success": False, "status": "pending"}

    if row["status"] == "rejected":
        return {"success": False, "status": "rejected"}

    physician_id = fetch_physician_id_by_user(row["user_id"])
    user = _build_user_dict(row, physician_id)

    log_action(row["user_id"], "login")
    return {"success": True, "status": "active", "user": user, "user_id_cookie": str(row["user_id"])}



def process_doctor_registration(data: dict) -> dict:
    if check_email_exists(data["email"]):
        existing = fetch_user_for_login(data["email"])
        if existing and existing["status"] == "rejected":
            if existing.get("updated_at"):
                updated_at = existing["updated_at"]
                now = datetime.now(timezone.utc) if updated_at.tzinfo else datetime.utcnow()
                diff = now - updated_at
                days_left = 30 - diff.days
                if days_left > 0:
                    return {
                        "error": True, 
                        "code": 403, 
                        "message": f"Your registration was rejected. You must wait {days_left} more day{'s' if days_left != 1 else ''} to re-apply."
                    }
        else:
            return {"error": True, "code": 400, "message": "Email already registered"}

    # Also check license number. A rejected physician might have the same license number,
    # but a different user might have it.
    if check_license_exists(data["license_number"]):
        # Check if the existing license number belongs to the same rejected user
        if not (existing and existing["status"] == "rejected" and existing.get("license_number") == data["license_number"]):
            return {"error": True, "code": 400, "message": "License number already registered"}

    hospital = fetch_hospital_by_id(data["hospital_id"])
    if not hospital or hospital.get("status") != "active":
        return {"error": True, "code": 400, "message": "Invalid hospital selection"}

    role_id = fetch_role_id_by_name("physician")
    if not role_id:
        return {"error": True, "code": 500, "message": "Physician role not found"}

    # Password is handled by Supabase Auth — no need to hash here
    # If password is provided (legacy flow), hash it; otherwise store NULL
    pw_hash = hash_password(data["password"]) if data.get("password") else None
    
    existing = fetch_user_for_login(data["email"]) if check_email_exists(data["email"]) else None
    
    if existing and existing["status"] == "rejected":
        # Overwrite specific rejected user row
        try:
            res = update_rejected_user_to_pending(data)
            user_id = res["user_id"]
            physician_id = res["physician_id"]
            return {
                "success": True,
                "user_id": str(user_id),
                "physician_id": str(physician_id),
                "message": "Registration re-submitted. Your account is back to pending approval.",
            }
        except Exception as e:
            return {"error": True, "code": 500, "message": f"Database error updating application: {e}"}

    # Fresh user insert
    user_id = insert_pending_user(
        data["email"], pw_hash, role_id, data["first_name"], data["last_name"],
        data.get("phone_number"), data["hospital_id"],
        auth_uid=data.get("auth_uid"),
    )

    physician_id = insert_pending_physician(
        user_id, data["license_number"], data.get("title"),
        data.get("specialization"), data.get("department"), data.get("grade")
    )

    return {
        "success": True,
        "user_id": str(user_id),
        "physician_id": str(physician_id),
        "message": "Registration submitted. Your account is pending approval.",
    }


def process_admin_registration(data: dict) -> dict:
    from models.admin_invite import get_valid_invite, mark_invite_used
    from core.db import db_cursor
    
    invite = get_valid_invite(data["token"])
    if not invite:
        return {"error": True, "code": 400, "message": "Invalid or expired invite token"}

    email = invite["email"]
    hospital_id = invite["hospital_id"]

    if check_email_exists(email):
        return {"error": True, "code": 400, "message": "Email already registered for an account"}

    role_id = fetch_role_id_by_name("hospital_admin")
    if not role_id:
        return {"error": True, "code": 500, "message": "Hospital Admin role not found"}

    pw_hash = hash_password(data["password"]) if data.get("password") else None

    try:
        with db_cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (email, password_hash, role_id, first_name, last_name, phone_number, hospital_id, status, auth_uid)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'active', %s)
                RETURNING user_id
                """,
                (email, pw_hash, role_id, data["first_name"], data["last_name"], data.get("phone_number"), hospital_id, data.get("auth_uid"))
            )
            user_id = cur.fetchone()["user_id"]
            
        mark_invite_used(data["token"])
        
        return {
            "success": True,
            "user_id": str(user_id),
            "message": "Hospital Admin account created successfully. You can now log in.",
        }
    except Exception as e:
        return {"error": True, "code": 500, "message": f"Database error: {e}"}


def process_google_auth(token: str, data: dict) -> dict:
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        google_id = idinfo["sub"]
        email = idinfo["email"]
        google_name = idinfo.get("name", email.split("@")[0])
        # Split Google's full name into first/last
        name_parts = google_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        picture = idinfo.get("picture")
    except ImportError:
        return {"error": True, "code": 500, "message": "Google auth library not installed. Run: pip install google-auth"}
    except Exception as e:
        return {"error": True, "code": 401, "message": f"Invalid Google token: {str(e)}"}

    row = fetch_user_by_google_id(google_id)
    
    if row:
        # Existing Google user
        if row["status"] == "pending":
            return {"success": False, "status": "pending"}
        if row["status"] == "rejected":
            return {"success": False, "status": "rejected"}

        physician_id = fetch_physician_id_by_user(row["user_id"])
        user = _build_user_dict(row, physician_id)
        return {"success": True, "status": row["status"], "user": user, "user_id_cookie": str(row["user_id"])}

    row = fetch_user_by_email_google(email)
    
    if row:
        # Link Google ID to existing account
        link_google_account(row["user_id"], google_id, picture)
        
        if row["status"] == "pending":
            return {"success": False, "status": "pending"}

        physician_id = fetch_physician_id_by_user(row["user_id"])
        user = _build_user_dict(row, physician_id)
        user["auth_provider"] = "google"
        user["profile_picture_url"] = picture or user.get("profile_picture_url")
        return {"success": True, "status": row["status"], "user": user, "user_id_cookie": str(row["user_id"])}

    # New user
    role_id = fetch_role_id_by_name("physician")
    user_id = insert_google_user(email, role_id, first_name, last_name, data.get("phone_number"), data.get("hospital_id"), google_id, picture)

    physician_id = None
    if data.get("license_number") and data.get("hospital_id"):
        phys_id_int = insert_pending_physician(
            user_id, data["license_number"], data.get("title"),
            data.get("specialization"), data.get("department"), data.get("grade")
        )
        physician_id = str(phys_id_int)

    return {
        "success": True,
        "status": "pending",
        "user_id": str(user_id),
        "physician_id": physician_id,
        "needs_profile": data.get("license_number") is None,
        "message": "Account created. Please complete your profile and await approval.",
    }


def get_current_user_data(user_id: int) -> dict:
    row = fetch_user_by_id_complete(user_id)
    if not row:
        return {"user": None}

    physician_id = fetch_physician_id_by_user(user_id) if row["role_name"] == "physician" else None
    return {"user": _build_user_dict(row, physician_id)}
