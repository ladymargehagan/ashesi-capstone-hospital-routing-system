"""
Authentication routes — Supabase Auth edition.

Supabase handles signup/login/session on the frontend.
These endpoints handle:
  - /register: Create public.users + physicians records after Supabase signup
  - /register-admin: Same for admin invite flow
  - /me: Return app profile for the current JWT bearer
  - /login: Legacy fallback for migrating existing local-password users to Supabase Auth
"""

from __future__ import annotations

import os
import re

from fastapi import APIRouter, Depends, HTTPException, Response, Request
from pydantic import BaseModel, Field, field_validator
from typing import Optional

from core.auth import get_current_user_any_status
from controllers.auth_controller import (
    process_login,
    process_doctor_registration,
    get_current_user_data,
    _build_user_dict,
)
from models.auth import (
    fetch_user_for_login,
    fetch_user_by_auth_uid,
    fetch_user_by_id_complete,
    fetch_physician_id_by_user,
    link_auth_uid,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---- request models ----

class DoctorRegisterRequest(BaseModel):
    """Doctor self-registration after Supabase signup."""
    auth_uid: str  # UUID from supabase.auth.signUp()
    full_name: str
    email: str
    phone_number: Optional[str] = None
    hospital_id: int
    license_number: str
    title: Optional[str] = None
    specialization: Optional[str] = None
    department: Optional[str] = None
    grade: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", v):
            raise ValueError("Invalid email format")
        return v


class AdminRegisterRequest(BaseModel):
    """Hospital admin registration via invite link, after Supabase signup."""
    auth_uid: str
    token: str
    full_name: str
    phone_number: Optional[str] = None


class LegacyLoginRequest(BaseModel):
    """Legacy login for migrating existing users to Supabase Auth."""
    email: str
    password: str


# ---- routes ----

@router.post("/login")
def legacy_login(req: LegacyLoginRequest):
    """
    Legacy login endpoint for migrating existing users.

    1. Validates bcrypt password against public.users
    2. Creates a Supabase Auth user via the Admin API
    3. Links auth_uid to the public.users row
    4. Returns the user profile so the frontend can complete Supabase sign-in
    """
    result = process_login(req.email, req.password)

    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 401), detail=result["message"])

    if result.get("success") is False:
        return {"success": False, "status": result["status"]}

    user_id = int(result["user_id_cookie"])
    row = fetch_user_by_id_complete(user_id)

    # Check if already migrated
    if row and row.get("auth_uid"):
        return {"success": True, "status": result["status"], "user": result["user"], "already_migrated": True}

    # Create Supabase Auth user via Admin API
    try:
        from supabase import create_client
        supabase_url = os.getenv("SUPABASE_URL", "")
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

        if supabase_url and service_key:
            sb = create_client(supabase_url, service_key)
            auth_result = sb.auth.admin.create_user({
                "email": req.email,
                "password": req.password,
                "email_confirm": True,
            })
            if auth_result and auth_result.user:
                link_auth_uid(user_id, str(auth_result.user.id))
                return {
                    "success": True,
                    "status": result["status"],
                    "user": result["user"],
                    "migrated": True,
                    "auth_uid": str(auth_result.user.id),
                }
    except Exception as e:
        # Migration failed but login itself succeeded — return the user anyway
        print(f"Supabase migration failed for {req.email}: {e}")

    return {"success": True, "status": result["status"], "user": result["user"], "migrated": False}


@router.post("/register")
def register_doctor(req: DoctorRegisterRequest):
    """
    Doctor self-registration. Supabase signup already happened on frontend.
    Creates public.users (pending) + physicians (pending) with auth_uid link.
    """
    data = req.model_dump()
    # Pass auth_uid through to the controller
    result = process_doctor_registration(data)

    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])

    return result


@router.post("/register-admin")
def register_admin(req: AdminRegisterRequest):
    """Hospital Admin registration consuming a secure invite token."""
    from controllers.auth_controller import process_admin_registration
    data = req.model_dump()
    result = process_admin_registration(data)

    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])

    return result


@router.get("/me")
def me(current_user: dict = Depends(get_current_user_any_status)):
    """
    Return the current user's profile from public.users.
    Works for any status (active, pending, rejected) so users can check their status.
    """
    if current_user.get("not_registered"):
        return {"user": None}

    user_id = current_user["id"]
    return get_current_user_data(user_id)


@router.post("/logout")
def logout():
    """No-op — logout is handled client-side by supabase.auth.signOut()."""
    return {"success": True}
