"""
Referral routes: list, get, create, update status, attachments.

Referrals include full patient details in responses so receiving hospitals
don't need separate patient fetches.
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Request
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
    get_attachment_file_data
)

router = APIRouter(prefix="/api/referrals", tags=["referrals"])

# File upload directory
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


# ---- models ----

class CreateReferral(BaseModel):
    patient_id: int
    referring_physician_id: int
    referring_hospital_id: int
    receiving_hospital_id: int
    severity: str
    stability: str
    emergency_type: str = "general"
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


class ReferralStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None


class ReferralAssign(BaseModel):
    physician_id: int


# ---- referral routes ----

@router.get("")
def list_referrals(
    physician_id: Optional[int] = None,
    hospital_id: Optional[int] = None,
    assigned_physician_id: Optional[int] = None,
    status: Optional[str] = None,
):
    """
    List referrals with hospital names, patient info, and clinical details.
    hospital_id matches BOTH referring and receiving hospitals.
    """
    return get_referrals_list(physician_id, hospital_id, assigned_physician_id, status)


@router.get("/{referral_id}")
def get_referral(referral_id: int):
    """Get a single referral with full details, patient info, and attachments."""
    referral = get_single_referral(referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral


@router.post("")
def create_referral(req: CreateReferral):
    result = process_create_referral(req.dict())
    return result


@router.put("/{referral_id}/status")
def update_referral_status(referral_id: int, req: ReferralStatusUpdate):
    """Update referral status (approve, reject, complete, cancel)."""
    result = modify_referral_status(referral_id, req.status, req.reason)
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
    return result


# ---- attachment routes ----

@router.post("/{referral_id}/attachments")
async def upload_attachment(referral_id: int, request: Request, file: UploadFile = File(...)):
    """Upload a file attachment to a referral."""
    # Get uploader user_id from cookie
    uploader_id = request.cookies.get("hrs_user_id", "1")
    
    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit")

    try:
        uploader_id_int = int(uploader_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user id")

    result = handle_attachment_upload(referral_id, file.filename, content, uploader_id_int, UPLOAD_DIR)
    
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
        
    return result


@router.put("/{referral_id}/assign")
def assign_referral(referral_id: int, req: ReferralAssign, request: Request):
    """Assign a referral to a physician (hospital admin action)."""
    result = handle_referral_assignment(referral_id, req.physician_id)
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])
    return result


@router.get("/{referral_id}/attachments")
def list_attachments(referral_id: int):
    """List all attachments for a referral."""
    return get_referral_attachments_list(referral_id)


@router.get("/attachments/{attachment_id}/download")
def download_attachment(attachment_id: int):
    """Download / view a specific attachment file."""
    result = get_attachment_file_data(attachment_id)
    
    if result.get("error"):
        raise HTTPException(status_code=result.get("code", 400), detail=result["message"])

    return FileResponse(
        path=result["path"],
        filename=result["filename"],
        media_type=result["media_type"],
    )
