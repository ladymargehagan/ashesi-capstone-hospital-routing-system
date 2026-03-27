"""
Hospital routes: list, get, and update hospitals.
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from controllers.hospital_controller import (
    get_hospitals_list, 
    get_hospital_details,
    update_hospital_profile,
    toggle_hospital_status
)
from core.auth import get_current_user, require_role

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])


# ---- models ----

class HospitalProfileUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    address: Optional[str] = None
    level: Optional[str] = None
    type: Optional[str] = None
    ownership: Optional[str] = None
    operating_hours: Optional[str] = None
    contact_phone: Optional[str] = None
    email: Optional[str] = None


class HospitalStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None


class HospitalFlagCreate(BaseModel):
    category: str
    notes: Optional[str] = None
    referral_id: Optional[int] = None


# ---- routes ----

@router.get("")
def list_hospitals(status: Optional[str] = None, level: Optional[str] = None):
    """List hospitals, optionally filtered by status and/or level. Public."""
    return get_hospitals_list(status, level)


@router.get("/{hospital_id}")
def get_hospital(hospital_id: int):
    """Get a single hospital with its resources and specialist counts. Public."""
    hospital = get_hospital_details(hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


@router.put("/{hospital_id}")
def update_hospital(
    hospital_id: int,
    req: HospitalProfileUpdate,
    current_user: dict = Depends(require_role("hospital_admin", "super_admin"))
):
    """Update a hospital's basic profile details. Requires hospital admin."""
    # Note: Using model_dump() instead of the deprecated dict()
    result = update_hospital_profile(hospital_id, req.model_dump(exclude_unset=True), current_user["id"])
    if result.get("error"):
        if result.get("message") == "No fields to update":
            raise HTTPException(status_code=400, detail=result["message"])
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@router.patch("/{hospital_id}/status")
def update_status(
    hospital_id: int,
    req: HospitalStatusUpdate,
    current_user: dict = Depends(require_role("super_admin"))
):
    """Activate or deactivate a hospital to stop referrals. Super admin only."""
    result = toggle_hospital_status(hospital_id, req.status, current_user["id"], req.reason)
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
    return result


@router.post("/{hospital_id}/flag")
def flag_hospital_data(
    hospital_id: int,
    req: HospitalFlagCreate,
    current_user: dict = Depends(require_role("physician")),
):
    """Flag a hospital's data as inconsistent. Requires physician role."""
    from models.hospital import insert_hospital_flag
    
    flag_id = insert_hospital_flag(
        hospital_id=hospital_id,
        referral_id=req.referral_id,
        flagging_physician_id=current_user.get("physician_id") or current_user["id"],
        category=req.category,
        notes=req.notes
    )
    return {"message": "Data flag created successfully", "flag_id": flag_id}
