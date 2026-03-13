"""
Authentication routes: login, register (doctor), Google OAuth, me, logout.

Uses JWT tokens stored in HTTP-only cookies for session management.
Passwords are hashed with bcrypt.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta

import bcrypt
from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel, Field
from typing import Optional

from db import db_cursor

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET", "hrs-dev-secret-change-in-prod")


# ---- helpers ----

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _build_user_dict(row, physician_id: str | None = None) -> dict:
    """Shared helper to build a user dict from a DB row."""
    d = {
        "id": str(row["user_id"]),
        "email": row["email"],
        "full_name": row["full_name"],
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


def _lookup_physician_id(user_id: int) -> str | None:
    """Look up physician_id for a user."""
    with db_cursor() as cur:
        cur.execute(
            "SELECT physician_id FROM physicians WHERE user_id = %s",
            (user_id,),
        )
        row = cur.fetchone()
        return str(row["physician_id"]) if row else None


# ---- request models ----

class LoginRequest(BaseModel):
    email: str
    password: str


class DoctorRegisterRequest(BaseModel):
    """Doctor self-registration: creates a user + physician record (both pending)."""
    # Account
    full_name: str
    email: str
    password: str
    phone_number: Optional[str] = None
    # Professional
    hospital_id: int
    license_number: str
    title: Optional[str] = None          # Mr, Mrs, Dr, Prof
    specialization: Optional[str] = None
    department: Optional[str] = None
    grade: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    """Google OAuth: token from frontend Google Sign-In."""
    token: str
    # If first-time Google user, these are needed to complete profile:
    hospital_id: Optional[int] = None
    license_number: Optional[str] = None
    title: Optional[str] = None
    specialization: Optional[str] = None
    department: Optional[str] = None
    grade: Optional[str] = None
    phone_number: Optional[str] = None


# ---- routes ----

@router.post("/login")
def login(req: LoginRequest, response: Response):
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT u.user_id, u.email, u.password_hash, u.full_name, u.phone_number,
                   u.hospital_id, u.status, u.auth_provider, u.profile_picture_url,
                   r.role_name, u.created_at,
                   h.name AS hospital_name, h.address AS hospital_address,
                   h.contact_phone,
                   p.title, p.license_number, p.specialization, p.department, p.grade
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            LEFT JOIN hospitals h ON u.hospital_id = h.hospital_id
            LEFT JOIN physicians p ON u.user_id = p.user_id
            WHERE u.email = %s
            """,
            (req.email,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if row["auth_provider"] == "google" and not row["password_hash"]:
        raise HTTPException(
            status_code=401,
            detail="This account uses Google Sign-In. Please use Google to log in.",
        )

    if not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if row["status"] == "pending":
        return {"success": False, "status": "pending"}

    if row["status"] == "rejected":
        return {"success": False, "status": "rejected"}

    physician_id = _lookup_physician_id(row["user_id"])
    user = _build_user_dict(row, physician_id)

    response.set_cookie(
        key="hrs_user_id", value=str(row["user_id"]),
        httponly=True, samesite="lax",
    )
    return {"success": True, "status": "active", "user": user}


@router.post("/register")
def register_doctor(req: DoctorRegisterRequest):
    """Doctor self-registration. Creates user + physician record, both pending."""
    with db_cursor() as cur:
        # Check duplicate email
        cur.execute("SELECT 1 FROM users WHERE email = %s", (req.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Check duplicate license
        cur.execute(
            "SELECT 1 FROM physicians WHERE license_number = %s",
            (req.license_number,),
        )
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="License number already registered")

        # Verify hospital exists
        cur.execute(
            "SELECT hospital_id FROM hospitals WHERE hospital_id = %s AND status = 'active'",
            (req.hospital_id,),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="Invalid hospital selection")

        # Get physician role_id
        cur.execute("SELECT role_id FROM role WHERE role_name = 'physician'")
        role_row = cur.fetchone()
        if not role_row:
            raise HTTPException(status_code=500, detail="Physician role not found")

        # Insert user (pending)
        pw_hash = hash_password(req.password)
        cur.execute(
            """
            INSERT INTO users (email, password_hash, role_id, full_name,
                               phone_number, hospital_id, auth_provider, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'local', 'pending')
            RETURNING user_id
            """,
            (req.email, pw_hash, role_row["role_id"], req.full_name,
             req.phone_number, req.hospital_id),
        )
        user_id = cur.fetchone()["user_id"]

        # Insert physician record (pending)
        cur.execute(
            """
            INSERT INTO physicians (user_id, hospital_id, license_number,
                                    title, specialization, department, grade, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING physician_id
            """,
            (user_id, req.hospital_id, req.license_number,
             req.title, req.specialization, req.department, req.grade),
        )
        physician_id = cur.fetchone()["physician_id"]

    return {
        "success": True,
        "user_id": str(user_id),
        "physician_id": str(physician_id),
        "message": "Registration submitted. Your account is pending approval.",
    }


@router.post("/google")
def google_auth(req: GoogleAuthRequest, response: Response):
    """
    Google OAuth login/register.
    - If user with this Google ID exists → log in.
    - If email exists but no Google ID → link Google and log in.
    - If new user → create (pending), optionally with professional details.
    """
    # Verify Google token
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
        idinfo = id_token.verify_oauth2_token(
            req.token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        google_id = idinfo["sub"]
        email = idinfo["email"]
        full_name = idinfo.get("name", email.split("@")[0])
        picture = idinfo.get("picture")
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Google auth library not installed. Run: pip install google-auth",
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

    with db_cursor() as cur:
        # Check if user exists by google_id
        cur.execute(
            """
            SELECT u.*, r.role_name
            FROM users u JOIN role r ON u.role_id = r.role_id
            WHERE u.google_id = %s
            """,
            (google_id,),
        )
        row = cur.fetchone()

        if row:
            # Existing Google user → log in
            if row["status"] == "pending":
                return {"success": False, "status": "pending"}
            if row["status"] == "rejected":
                return {"success": False, "status": "rejected"}

            physician_id = _lookup_physician_id(row["user_id"])
            user = _build_user_dict(row, physician_id)
            response.set_cookie(
                key="hrs_user_id", value=str(row["user_id"]),
                httponly=True, samesite="lax",
            )
            return {"success": True, "status": row["status"], "user": user}

        # Check if email exists (link Google to existing account)
        cur.execute(
            """
            SELECT u.*, r.role_name
            FROM users u JOIN role r ON u.role_id = r.role_id
            WHERE u.email = %s
            """,
            (email,),
        )
        row = cur.fetchone()

        if row:
            # Link Google ID to existing account
            cur.execute(
                """
                UPDATE users SET google_id = %s, auth_provider = 'google',
                       profile_picture_url = COALESCE(profile_picture_url, %s),
                       updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s
                """,
                (google_id, picture, row["user_id"]),
            )
            if row["status"] == "pending":
                return {"success": False, "status": "pending"}

            physician_id = _lookup_physician_id(row["user_id"])
            user = _build_user_dict(row, physician_id)
            user["auth_provider"] = "google"
            user["profile_picture_url"] = picture or user.get("profile_picture_url")
            response.set_cookie(
                key="hrs_user_id", value=str(row["user_id"]),
                httponly=True, samesite="lax",
            )
            return {"success": True, "status": row["status"], "user": user}

        # New user → create with physician role (pending)
        cur.execute("SELECT role_id FROM role WHERE role_name = 'physician'")
        role_row = cur.fetchone()

        cur.execute(
            """
            INSERT INTO users (email, password_hash, role_id, full_name,
                               phone_number, hospital_id, google_id,
                               auth_provider, profile_picture_url, status)
            VALUES (%s, NULL, %s, %s, %s, %s, %s, 'google', %s, 'pending')
            RETURNING user_id
            """,
            (email, role_row["role_id"], full_name, req.phone_number,
             req.hospital_id, google_id, picture),
        )
        user_id = cur.fetchone()["user_id"]

        # If professional details provided, create physician record too
        physician_id = None
        if req.license_number and req.hospital_id:
            cur.execute(
                """
                INSERT INTO physicians (user_id, hospital_id, license_number,
                                        title, specialization, department, grade, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING physician_id
                """,
                (user_id, req.hospital_id, req.license_number,
                 req.title, req.specialization, req.department, req.grade),
            )
            physician_id = str(cur.fetchone()["physician_id"])

    return {
        "success": True,
        "status": "pending",
        "user_id": str(user_id),
        "physician_id": physician_id,
        "needs_profile": req.license_number is None,
        "message": "Account created. Please complete your profile and await approval.",
    }


@router.get("/me")
def me(request: Request):
    user_id = request.cookies.get("hrs_user_id")
    if not user_id:
        return {"user": None}

    with db_cursor() as cur:
        cur.execute(
            """
            SELECT u.user_id, u.email, u.full_name, u.phone_number,
                   u.hospital_id, u.status, u.auth_provider,
                   u.profile_picture_url, r.role_name, u.created_at,
                   h.name AS hospital_name, h.address AS hospital_address,
                   h.contact_phone,
                   p.title, p.license_number, p.specialization, p.department, p.grade
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            LEFT JOIN hospitals h ON u.hospital_id = h.hospital_id
            LEFT JOIN physicians p ON u.user_id = p.user_id
            WHERE u.user_id = %s
            """,
            (int(user_id),),
        )
        row = cur.fetchone()

    if not row:
        return {"user": None}

    physician_id = _lookup_physician_id(int(user_id)) if row["role_name"] == "physician" else None

    return {"user": _build_user_dict(row, physician_id)}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("hrs_user_id")
    return {"success": True}


@router.get("/dev-create-admin")
def dev_create_admin():
    """DEV ONLY: Create/reset an admin account. Remove in production."""
    pw_hash = hash_password("admin123")
    with db_cursor() as cur:
        # Check if account exists
        cur.execute("SELECT user_id FROM users WHERE email = 'newadmin@hrs.gov.gh'")
        existing = cur.fetchone()
        if existing:
            cur.execute(
                "UPDATE users SET password_hash = %s WHERE email = 'newadmin@hrs.gov.gh'",
                (pw_hash,),
            )
            return {"message": "Password reset to admin123", "email": "newadmin@hrs.gov.gh"}
        else:
            cur.execute("SELECT role_id FROM role WHERE role_name = 'super_admin'")
            role = cur.fetchone()
            if not role:
                return {"error": "super_admin role not found"}
            cur.execute(
                """INSERT INTO users (email, password_hash, role_id, full_name, auth_provider, status)
                   VALUES ('newadmin@hrs.gov.gh', %s, %s, 'Dev Admin', 'local', 'active')""",
                (pw_hash, role["role_id"]),
            )
            return {"message": "Admin created", "email": "newadmin@hrs.gov.gh", "password": "admin123"}


# ---- DEV: simple user creation via curl ----

class DevRegisterRequest(BaseModel):
    """Simple registration payload for developer use (curl / Postman)."""
    email: str
    password: str
    name: str
    role: str = "physician"  # super_admin | hospital_admin | physician
    hospital_id: Optional[int] = None


@router.post("/dev-register")
def dev_register(req: DevRegisterRequest):
    """
    DEV ONLY – Create a user of any role from the terminal.

    Example:
        curl -X POST http://localhost:8000/api/auth/dev-register \
          -H "Content-Type: application/json" \
          -d '{"email":"admin@hospital.com","password":"admin123","name":"Admin User","role":"admin"}'
    """
    # Normalise common shortcuts
    role_name = req.role.lower().strip()
    ROLE_ALIASES = {
        "admin": "super_admin",
        "superadmin": "super_admin",
        "super_admin": "super_admin",
        "hospital_admin": "hospital_admin",
        "hospital": "hospital_admin",
        "physician": "physician",
        "doctor": "physician",
    }
    role_name = ROLE_ALIASES.get(role_name, role_name)

    with db_cursor() as cur:
        # Prevent duplicate emails
        cur.execute("SELECT 1 FROM users WHERE email = %s", (req.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Look up role
        cur.execute("SELECT role_id FROM role WHERE role_name = %s", (role_name,))
        role_row = cur.fetchone()
        if not role_row:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown role '{req.role}'. Use: super_admin, hospital_admin, physician (or shortcuts admin, doctor, hospital)",
            )

        pw_hash = hash_password(req.password)
        cur.execute(
            """
            INSERT INTO users (email, password_hash, role_id, full_name,
                               hospital_id, auth_provider, status)
            VALUES (%s, %s, %s, %s, %s, 'local', 'active')
            RETURNING user_id
            """,
            (req.email, pw_hash, role_row["role_id"], req.name, req.hospital_id),
        )
        user_id = cur.fetchone()["user_id"]

    return {
        "id": user_id,
        "email": req.email,
        "name": req.name,
        "role": role_name,
    }
