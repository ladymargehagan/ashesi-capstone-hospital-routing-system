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

    if not row["password_hash"] or not verify_password(password, row["password_hash"]):
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



def get_current_user_data(user_id: int) -> dict:
    row = fetch_user_by_id_complete(user_id)
    if not row:
        return {"user": None}

    physician_id = fetch_physician_id_by_user(user_id) if row["role_name"] == "physician" else None
    return {"user": _build_user_dict(row, physician_id)}
