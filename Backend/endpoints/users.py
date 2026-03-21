"""
User management routes (super admin): list users, update status.
Also includes physician-specific queries and self-service profile updates.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional

from controllers.user_controller import (
    get_all_users,
    get_all_physicians,
    change_user_status,
    modify_user_profile,
    change_user_role,
)
from core.auth import get_current_user, require_role

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
def list_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_role("super_admin")),
):
    """List all users. Super admin only."""
    return get_all_users(role, status)


@router.put("/{user_id}/status")
def update_user_status(
    user_id: int,
    req: UserStatusUpdate,
    current_user: dict = Depends(require_role("super_admin")),
):
    """Approve or reject a user. Super admin only."""
    result = change_user_status(user_id, req.status)
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@router.get("/physicians")
def list_physicians(
    hospital_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_role("super_admin", "hospital_admin")),
):
    """List physicians with user and hospital info."""
    return get_all_physicians(hospital_id, status)


@router.put("/{user_id}/profile")
def update_user_profile(
    user_id: int,
    req: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update profile fields (name, phone, physician details). Self-service for any logged-in user."""
    result = modify_user_profile(user_id, req.dict(exclude_unset=True))
    if result.get("error"):
        if result.get("message") == "No fields to update":
            raise HTTPException(status_code=400, detail=result["message"])
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    req: UserRoleUpdate,
    current_user: dict = Depends(require_role("super_admin")),
):
    """Change a user's role. Super admin only."""
    result = change_user_role(user_id, current_user["id"], req.role, req.hospital_id)
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
    return result
