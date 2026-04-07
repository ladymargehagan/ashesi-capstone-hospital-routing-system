"""
Referral routes: list, get, create, update status, attachments.

Referrals include full patient details in responses so receiving hospitals
don't need separate patient fetches.
"""

from __future__ import annotations

import os
import traceback
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

from controllers.referral_controller import (
    get_referrals_list,
    get_single_referral,
    process_create_referral,
    modify_referral_status,
    handle_referral_assignment,
    handle_attachment_upload,
    get_referral_attachments_list,
    get_attachment_file_data,
    add_transit_update,
    get_transit_updates,
)
from core.auth import get_current_user, require_role

router = APIRouter(prefix="/api/referrals", tags=["referrals"])

# File upload directory
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


# ---- models ----

class TransitUpdateIn(BaseModel):
    update_text: str

class CreateReferral(BaseModel):
    # If patient_id is -1, dynamic patient_details must be provided
    patient_id: int
    patient_details: Optional[dict] = None
    referring_physician_id: int
    referring_hospital_id: int
    receiving_hospital_id: int
    severity: str
    stability: str
    referral_reason: str = "general"
    urgency_level: str = "routine"
    known_allergies: Optional[str] = None
    pre_existing_conditions: Optional[str] = None
    estimated_arrival_minutes: Optional[int] = None
    # Clinical details
    presenting_complaint: str
    clinical_history: Optional[str] = None
    initial_diagnosis: Optional[str] = None
    current_condition: Optional[str] = None
    clinical_summary: Optional[str] = None
    examination_findings: Optional[str] = None
    working_diagnosis: Optional[str] = None
    reason_for_referral: Optional[str] = None
    investigations_done: Optional[str] = None
    treatment_given: Optional[str] = None
    additional_notes: Optional[str] = None
    required_specialist: Optional[str] = None
    required_facility: Optional[str] = None
    # Stage 4 Additions (Vitals and Location)
    vital_signs: Optional[dict] = None
    incident_lat: Optional[float] = None
    incident_lon: Optional[float] = None


class ReferralStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None
    outcome: Optional[str] = None       # DB enum: discharged | transferred_again | deceased | ongoing
    outcome_notes: Optional[str] = None # Free-text summary


class ReferralAssign(BaseModel):
    physician_id: int
    force: bool = False  # Set True to override specialization mismatch warning


# ---- referral routes ----

@router.get("")
def list_referrals(
    physician_id: Optional[int] = None,
    hospital_id: Optional[int] = None,
    assigned_physician_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    List referrals with hospital names, patient info, and clinical details.
    hospital_id matches BOTH referring and receiving hospitals.
    """
    return get_referrals_list(physician_id, hospital_id, assigned_physician_id, patient_id, status)


@router.get("/{referral_id}")
def get_referral(
    referral_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Get a single referral with full details, patient info, and attachments."""
    referral = get_single_referral(referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral


@router.post("")
def create_referral(
    req: CreateReferral,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role("physician", "hospital_admin")),
):
    """Create a referral."""
    try:
        result = process_create_referral(req.model_dump(), current_user, background_tasks=background_tasks)
        if result.get("error"):
            raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[ERROR] create_referral unhandled exception:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Referral creation failed: {exc}")


@router.put("/{referral_id}/status")
def update_referral_status(
    referral_id: int,
    req: ReferralStatusUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role("hospital_admin", "super_admin", "physician")),
):
    """Update referral status (approve, reject, complete, cancel, in_transit)"""
    if req.status in ["approved", "rejected"] and current_user.get("role") == "physician":
        raise HTTPException(status_code=403, detail="Physicians cannot approve or reject referrals.")

    try:
        result = modify_referral_status(
            referral_id,
            req.status,
            reason=req.reason,
            outcome=req.outcome,
            outcome_notes=req.outcome_notes,
            background_tasks=background_tasks,
        )
        if result.get("error"):
            raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[ERROR] update_referral_status unhandled exception:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Status update failed: {exc}")


# ---- attachment routes ----

@router.post("/{referral_id}/attachments")
async def upload_attachment(
    referral_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a file attachment to a referral."""
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit")

    result = handle_attachment_upload(
        referral_id, file.filename, content, current_user["id"], UPLOAD_DIR
    )
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])

    return result


@router.put("/{referral_id}/assign")
def assign_referral(
    referral_id: int,
    req: ReferralAssign,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role("hospital_admin", "super_admin")),
):
    """Assign a referral to a physician (hospital admin action)."""
    result = handle_referral_assignment(referral_id, req.physician_id, current_user.get("id"), background_tasks=background_tasks, force=req.force)
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
    return result


@router.get("/{referral_id}/attachments")
def list_attachments(
    referral_id: int,
    current_user: dict = Depends(get_current_user),
):
    """List all attachments for a referral."""
    return get_referral_attachments_list(referral_id)


@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Download / view a specific attachment file."""
    result = get_attachment_file_data(attachment_id)
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])

    return FileResponse(
        path=result["path"],
        filename=result["filename"],
        media_type=result["media_type"],
    )


@router.post("/{referral_id}/transit-updates")
def create_transit_update(
    referral_id: int,
    payload: TransitUpdateIn,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Submit a live condition update for an in-transit patient."""
    result = add_transit_update(referral_id, payload.update_text, current_user["id"], background_tasks=background_tasks)
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
    return result


@router.get("/{referral_id}/transit-updates")
def list_transit_updates(
    referral_id: int,
    current_user: dict = Depends(get_current_user),
):
    """List all live condition updates for a referral."""
    result = get_transit_updates(referral_id)
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
    return result
