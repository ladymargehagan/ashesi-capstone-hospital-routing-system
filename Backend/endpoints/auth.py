"""
Authentication routes: login, register (doctor), Google OAuth, me, logout.

Uses JWT tokens stored in HTTP-only cookies for session management.
Passwords are hashed with bcrypt.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel, Field
from typing import Optional

from controllers.auth_controller import (
    process_login,
    process_doctor_registration,
    process_google_auth,
    get_current_user_data,
    create_dev_admin,
    process_dev_register
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


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


class DevRegisterRequest(BaseModel):
    """Simple registration payload for developer use (curl / Postman)."""
    email: str
    password: str
    name: str
    role: str = "physician"  # super_admin | hospital_admin | physician
    hospital_id: Optional[int] = None


# ---- routes ----

@router.post("/login")
def login(req: LoginRequest, response: Response):
    result = process_login(req.email, req.password)
    
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 401), detail=result["message"])

    if result.get("success") is False:
        return {"success": False, "status": result["status"]}

    response.set_cookie(
        key="hrs_user_id", value=result["user_id_cookie"],
        httponly=True, samesite="lax",
    )
    return {"success": True, "status": result["status"], "user": result["user"]}


@router.post("/register")
def register_doctor(req: DoctorRegisterRequest):
    """Doctor self-registration. Creates user + physician record, both pending."""
    result = process_doctor_registration(req.model_dump())
    
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])

    return result


@router.post("/google")
def google_auth(req: GoogleAuthRequest, response: Response):
    """
    Google OAuth login/register.
    - If user with this Google ID exists → log in.
    - If email exists but no Google ID → link Google and log in.
    - If new user → create (pending), optionally with professional details.
    """
    result = process_google_auth(req.token, req.model_dump(exclude={'token'}))
    
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])

    if result.get("success") is False:
        return {"success": False, "status": result["status"]}

    if result.get("user"):
        response.set_cookie(
            key="hrs_user_id", value=result["user_id_cookie"],
            httponly=True, samesite="lax",
        )
        return {"success": True, "status": result["status"], "user": result["user"]}

    return {
        "success": True,
        "status": result["status"],
        "user_id": result["user_id"],
        "physician_id": result["physician_id"],
        "needs_profile": result["needs_profile"],
        "message": result["message"],
    }


@router.get("/me")
def me(request: Request):
    user_id_str = request.cookies.get("hrs_user_id")
    if not user_id_str:
        return {"user": None}

    try:
        user_id = int(user_id_str)
    except ValueError:
        return {"user": None}

    return get_current_user_data(user_id)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("hrs_user_id")
    return {"success": True}


@router.get("/dev-create-admin")
def dev_create_admin_route():
    """DEV ONLY: Create/reset an admin account. Remove in production."""
    result = create_dev_admin()
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 500), detail=result["message"])
    return result


@router.post("/dev-register")
def dev_register(req: DevRegisterRequest):
    """
    DEV ONLY – Create a user of any role from the terminal.
    """
    result = process_dev_register(req.model_dump())
    
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
        
    return result
