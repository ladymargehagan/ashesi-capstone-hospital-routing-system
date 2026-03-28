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


class HospitalCreate(BaseModel):
    name: str
    level: str
    type: str
    ownership: str
    address: str
    contact_phone: Optional[str] = None
    email: Optional[str] = None
    admin_email: Optional[str] = None
    initial_resources: Optional[list] = []


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


@router.post("")
def create_hospital(
    req: HospitalCreate,
    current_user: dict = Depends(require_role("super_admin"))
):
    """Create a new hospital instance (Super Admin only)."""
    from controllers.hospital_controller import create_new_hospital
    result = create_new_hospital(req.model_dump(exclude_unset=True), current_user["id"])
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
    return result


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
    from core.db import db_cursor

    # Look up the physician record from the logged-in user_id
    with db_cursor() as cur:
        cur.execute(
            "SELECT physician_id FROM physicians WHERE user_id = %s",
            (current_user["id"],)
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Physician record not found for this user")

    flag_id = insert_hospital_flag(
        hospital_id=hospital_id,
        referral_id=req.referral_id,
        flagging_physician_id=row["physician_id"],
        category=req.category,
        notes=req.notes
    )
    return {"message": "Data flag created successfully", "flag_id": flag_id}


@router.get("/{hospital_id}/flags")
def list_hospital_flags(
    hospital_id: int,
    current_user: dict = Depends(require_role("hospital_admin", "super_admin")),
):
    """List all active data consistency flags for a hospital."""
    from models.hospital import fetch_active_hospital_flags
    
    # Ensure hospital admin can only view their own hospital's flags
    if current_user["role"] == "hospital_admin" and str(current_user.get("hospital_id")) != str(hospital_id):
        raise HTTPException(status_code=403, detail="Not authorized to view flags for this hospital")
        
    try:
        flags = fetch_active_hospital_flags(hospital_id)
        # Format dates
        formatted_flags = [
            {
                "flag_id": f["flag_id"],
                "category": f["category"],
                "notes": f["notes"],
                "created_at": f["created_at"].isoformat() if f["created_at"] else None,
                "flagging_physician_name": f["flagging_physician_name"]
            }
            for f in flags
        ]
        return formatted_flags
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/flags/{flag_id}/resolve")
def resolve_hospital_flag(
    flag_id: int,
    current_user: dict = Depends(require_role("hospital_admin", "super_admin")),
):
    """Mark a data consistency flag as resolved."""
    from core.db import db_cursor
    
    with db_cursor() as cur:
        # First check if flag exists and belongs to the admin's hospital
        cur.execute("SELECT hospital_id FROM hospital_data_flags WHERE flag_id = %s", (flag_id,))
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Flag not found")
            
        if current_user["role"] == "hospital_admin" and str(current_user.get("hospital_id")) != str(row["hospital_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to resolve flags for this hospital")
            
        cur.execute(
            "UPDATE hospital_data_flags SET resolved = TRUE, resolved_at = CURRENT_TIMESTAMP WHERE flag_id = %s",
            (flag_id,)
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=400, detail="Failed to resolve flag")
            
    return {"success": True, "message": "Flag marked as resolved"}
