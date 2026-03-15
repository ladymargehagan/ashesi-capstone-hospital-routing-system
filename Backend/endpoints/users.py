"""
User management routes (super admin): list users, update status.
Also includes physician-specific queries.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional

from controllers.user_controller import (
    get_all_users,
    get_all_physicians,
    change_user_status,
    modify_user_profile,
    change_user_role
)

router = APIRouter(prefix="/api/users", tags=["users"])


# ---- models ----

class UserStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|rejected)$")


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    title: Optional[str] = None
    license_number: Optional[str] = None
    specialization: Optional[str] = None
    department: Optional[str] = None
    grade: Optional[str] = None


class UserRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(physician|hospital_admin|super_admin)$")
    hospital_id: Optional[int] = None


# ---- routes ----

@router.get("")
def list_users(role: Optional[str] = None, status: Optional[str] = None):
    return get_all_users(role, status)


@router.put("/{user_id}/status")
def update_user_status(user_id: int, req: UserStatusUpdate):
    result = change_user_status(user_id, req.status)
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@router.get("/physicians")
def list_physicians(hospital_id: Optional[int] = None, status: Optional[str] = None):
    """List physicians with user and hospital info. Only shows users with current physician role."""
    return get_all_physicians(hospital_id, status)


@router.put("/{user_id}/profile")
def update_user_profile(user_id: int, req: UserProfileUpdate):
    """Update user profile fields (name, phone) and physician fields if applicable."""
    result = modify_user_profile(user_id, req.dict(exclude_unset=True))
    if result.get("error"):
        if result.get("message") == "No fields to update":
            raise HTTPException(status_code=400, detail=result["message"])
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@router.put("/{user_id}/role")
def update_user_role(user_id: int, req: UserRoleUpdate, request: Request):
    """Change a user's role (super admin only). Handles physician record lifecycle."""
    caller_id = request.cookies.get("hrs_user_id")
    if not caller_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        caller_id_int = int(caller_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid session")

    result = change_user_role(user_id, caller_id_int, req.role, req.hospital_id)
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
    
    return result
