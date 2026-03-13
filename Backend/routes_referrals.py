"""
Referral routes: list, get, create, update status, attachments.

Referrals include full patient details in responses so receiving hospitals
don't need separate patient fetches.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List

from db import db_cursor
from email_service import notify_referral_created, notify_referral_status_changed

router = APIRouter(prefix="/api/referrals", tags=["referrals"])

# File upload directory
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "uploads")))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_FILE_TYPES = {"pdf", "jpg", "jpeg", "png", "webp"}
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


# ---- helpers ----

def _row_to_referral(row, details=None, patient=None, attachments=None) -> dict:
    referral = {
        "id": str(row["referral_id"]),
        "patient_id": str(row["patient_id"]),
        "referring_physician_id": str(row["referring_physician_id"]),
        "referring_hospital_id": str(row["referring_hospital_id"]),
        "receiving_hospital_id": str(row["receiving_hospital_id"]),
        "status": row["status"],
        "severity": row["severity"],
        "stability": row["stability"],
        "emergency_type": row.get("emergency_type", "general"),
        "submitted_at": row["submitted_at"].isoformat() if row.get("submitted_at") else None,
        "approved_at": row["approved_at"].isoformat() if row.get("approved_at") else None,
        "rejected_at": row["rejected_at"].isoformat() if row.get("rejected_at") else None,
        "completed_at": row["completed_at"].isoformat() if row.get("completed_at") else None,
        "cancelled_at": row["cancelled_at"].isoformat() if row.get("cancelled_at") else None,
        "rejection_reason": row.get("rejection_reason"),
        "cancellation_reason": row.get("cancellation_reason"),
        "estimated_arrival_minutes": row.get("estimated_arrival_minutes"),
        "assigned_physician_id": str(row["assigned_physician_id"]) if row.get("assigned_physician_id") else None,
        # Hospital names (joined)
        "referring_hospital_name": row.get("referring_hospital_name"),
        "receiving_hospital_name": row.get("receiving_hospital_name"),
        "referring_physician_name": row.get("physician_name"),
        "assigned_physician_name": row.get("assigned_physician_name"),
    }

    if details:
        referral["details"] = {
            "presenting_complaint": details.get("presenting_complaint"),
            "clinical_history": details.get("clinical_history"),
            "initial_diagnosis": details.get("initial_diagnosis"),
            "current_condition": details.get("current_condition"),
            "clinical_summary": details.get("clinical_summary"),
            "examination_findings": details.get("examination_findings"),
            "working_diagnosis": details.get("working_diagnosis"),
            "reason_for_referral": details.get("reason_for_referral"),
            "investigations_done": details.get("investigations_done"),
            "treatment_given": details.get("treatment_given"),
            "additional_notes": details.get("additional_notes"),
            "required_specialist": details.get("required_specialist"),
            "required_facility": details.get("required_facility"),
        }

    if patient:
        referral["patient"] = {
            "id": str(patient["patient_id"]),
            "full_name": patient["full_name"],
            "date_of_birth": str(patient["date_of_birth"]) if patient.get("date_of_birth") else None,
            "sex": patient.get("sex"),
            "nhis_number": patient.get("nhis_number"),
            "nhis_status": patient.get("nhis_status"),
            "contact_number": patient.get("contact_number"),
            "address": patient.get("address"),
            "next_of_kin_name": patient.get("next_of_kin_name"),
            "next_of_kin_contact": patient.get("next_of_kin_contact"),
        }
        # Top-level convenience fields for frontend table display
        referral["patient_name"] = patient.get("full_name")
        if patient.get("date_of_birth"):
            from datetime import date
            try:
                dob = patient["date_of_birth"]
                if isinstance(dob, str):
                    dob = date.fromisoformat(dob)
                today = date.today()
                referral["patient_age"] = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            except Exception:
                referral["patient_age"] = None

    if attachments is not None:
        referral["attachments"] = [
            {
                "id": str(a["attachment_id"]),
                "file_name": a["file_name"],
                "file_type": a["file_type"],
                "file_size_bytes": a["file_size_bytes"],
                "uploaded_at": a["uploaded_at"].isoformat() if a.get("uploaded_at") else None,
            }
            for a in attachments
        ]

    return referral


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
    with db_cursor() as cur:
        query = """
            SELECT r.*,
                   rh.name AS referring_hospital_name,
                   recvh.name AS receiving_hospital_name,
                   u.full_name AS physician_name,
                   p.full_name AS patient_name,
                   p.date_of_birth, p.sex, p.nhis_number, p.contact_number,
                   au.full_name AS assigned_physician_name,
                   rd.presenting_complaint, rd.clinical_history,
                   rd.initial_diagnosis, rd.current_condition,
                   rd.examination_findings, rd.working_diagnosis,
                   rd.reason_for_referral, rd.investigations_done,
                   rd.treatment_given, rd.additional_notes
            FROM referrals r
            JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
            JOIN hospitals recvh ON r.receiving_hospital_id = recvh.hospital_id
            JOIN physicians ph ON r.referring_physician_id = ph.physician_id
            JOIN users u ON ph.user_id = u.user_id
            JOIN patients p ON r.patient_id = p.patient_id
            LEFT JOIN referral_details rd ON r.referral_id = rd.referral_id
            LEFT JOIN physicians aph ON r.assigned_physician_id = aph.physician_id
            LEFT JOIN users au ON aph.user_id = au.user_id
            WHERE 1=1
        """
        params: list = []

        if physician_id:
            query += " AND (r.referring_physician_id = %s OR r.assigned_physician_id = %s)"
            params.extend([physician_id, physician_id])
        if hospital_id:
            query += " AND (r.referring_hospital_id = %s OR r.receiving_hospital_id = %s)"
            params.extend([hospital_id, hospital_id])
        if assigned_physician_id:
            query += " AND r.assigned_physician_id = %s"
            params.append(assigned_physician_id)
        if status:
            query += " AND r.status = %s"
            params.append(status)

        query += " ORDER BY r.submitted_at DESC"
        cur.execute(query, params)
        rows = cur.fetchall()

    results = []
    for row in rows:
        patient_info = {
            "patient_id": row["patient_id"],
            "full_name": row["patient_name"],
            "date_of_birth": row.get("date_of_birth"),
            "sex": row.get("sex"),
            "nhis_number": row.get("nhis_number"),
            "contact_number": row.get("contact_number"),
        }
        details_info = {
            "presenting_complaint": row.get("presenting_complaint"),
            "clinical_history": row.get("clinical_history"),
            "initial_diagnosis": row.get("initial_diagnosis"),
            "current_condition": row.get("current_condition"),
            "examination_findings": row.get("examination_findings"),
            "working_diagnosis": row.get("working_diagnosis"),
            "reason_for_referral": row.get("reason_for_referral"),
            "investigations_done": row.get("investigations_done"),
            "treatment_given": row.get("treatment_given"),
            "additional_notes": row.get("additional_notes"),
        }
        r = _row_to_referral(row, details=details_info, patient=patient_info)
        results.append(r)

    return results


@router.get("/{referral_id}")
def get_referral(referral_id: int):
    """Get a single referral with full details, patient info, and attachments."""
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT r.*,
                   rh.name AS referring_hospital_name,
                   recvh.name AS receiving_hospital_name,
                   u.full_name AS physician_name
            FROM referrals r
            JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
            JOIN hospitals recvh ON r.receiving_hospital_id = recvh.hospital_id
            JOIN physicians ph ON r.referring_physician_id = ph.physician_id
            JOIN users u ON ph.user_id = u.user_id
            WHERE r.referral_id = %s
            """,
            (referral_id,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Referral not found")

    # Get details
    with db_cursor() as cur:
        cur.execute(
            "SELECT * FROM referral_details WHERE referral_id = %s",
            (referral_id,),
        )
        details = cur.fetchone()

    # Get patient
    with db_cursor() as cur:
        cur.execute(
            "SELECT * FROM patients WHERE patient_id = %s",
            (row["patient_id"],),
        )
        patient = cur.fetchone()

    # Get attachments
    with db_cursor() as cur:
        cur.execute(
            "SELECT * FROM referral_attachments WHERE referral_id = %s ORDER BY uploaded_at",
            (referral_id,),
        )
        attachments = cur.fetchall()

    return _row_to_referral(row, details=details, patient=patient, attachments=attachments)


@router.post("")
def create_referral(req: CreateReferral):
    from api import _load_hospitals_from_db
    from referral_engine import ReferralEngine, EngineConfig, PatientCase
    import json
    from datetime import datetime
    
    with db_cursor() as cur:
        # Get lat/lon of referring hospital
        cur.execute("SELECT gps_coordinates FROM hospitals WHERE hospital_id = %s", (req.referring_hospital_id,))
        row = cur.fetchone()
        lat, lon = 5.56, -0.20
        if row and row.get("gps_coordinates"):
            gps = row["gps_coordinates"]
            if isinstance(gps, str):
                parts = gps.strip("()").split(",")
                lat, lon = float(parts[0]), float(parts[1])
            elif isinstance(gps, tuple):
                lat, lon = float(gps[0]), float(gps[1])
        
        # Run recommendation
        now = datetime.utcnow()
        hospitals = _load_hospitals_from_db(now)
        engine = ReferralEngine(hospitals, config=EngineConfig(top_k=5))
        patient = PatientCase(lat=lat, lon=lon, emergency_type=req.emergency_type, severity=req.severity, stability=req.stability, at_time=now)
        res = engine.rank(patient)
        
        # Build queue excluding chosen receiving hospital and referring hospital
        routing_queue = []
        for r in res.get("recommendations", []):
            hid = str(r["hospital_id"])
            if hid != str(req.receiving_hospital_id) and hid != str(req.referring_hospital_id):
                routing_queue.append(hid)

        # Create referral
        cur.execute(
            """
            INSERT INTO referrals
                (patient_id, referring_physician_id, referring_hospital_id,
                 receiving_hospital_id, severity, stability, emergency_type,
                 estimated_arrival_minutes, routing_queue)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING referral_id
            """,
            (req.patient_id, req.referring_physician_id, req.referring_hospital_id,
             req.receiving_hospital_id, req.severity, req.stability,
             req.emergency_type, req.estimated_arrival_minutes, json.dumps(routing_queue)),
        )
        referral_id = cur.fetchone()["referral_id"]

        # Create referral details
        cur.execute(
            """
            INSERT INTO referral_details
                (referral_id, presenting_complaint, clinical_history,
                 initial_diagnosis, current_condition, clinical_summary,
                 examination_findings, working_diagnosis, reason_for_referral,
                 investigations_done, treatment_given, additional_notes,
                 required_specialist, required_facility)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (referral_id, req.presenting_complaint, req.clinical_history,
             req.initial_diagnosis, req.current_condition, req.clinical_summary,
             req.examination_findings, req.working_diagnosis, req.reason_for_referral,
             req.investigations_done, req.treatment_given, req.additional_notes,
             req.required_specialist, req.required_facility),
        )

    # Send notification to receiving hospital
    try:
        with db_cursor() as cur:
            cur.execute("SELECT full_name FROM patients WHERE patient_id = %s", (req.patient_id,))
            p = cur.fetchone()
            patient_name = p["full_name"] if p else "Unknown"
        notify_referral_created(referral_id, patient_name, req.receiving_hospital_id)
    except Exception as e:
        print(f"[WARN] Email notification failed: {e}")

    return {"success": True, "referral_id": str(referral_id)}


@router.put("/{referral_id}/status")
def update_referral_status(referral_id: int, req: ReferralStatusUpdate):
    """Update referral status (approve, reject, complete, cancel)."""
    valid = {"pending", "approved", "rejected", "en_route", "completed", "cancelled"}
    if req.status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid}")

    with db_cursor() as cur:
        # Build timestamp update
        ts_col = {
            "approved": "approved_at",
            "rejected": "rejected_at",
            "arrived": "arrived_at",
            "completed": "completed_at",
            "cancelled": "cancelled_at",
        }.get(req.status)

        reason_col = {
            "rejected": "rejection_reason",
            "cancelled": "cancellation_reason",
        }.get(req.status)

        updates = ["status = %s"]
        params: list = [req.status]

        if ts_col:
            updates.append(f"{ts_col} = CURRENT_TIMESTAMP")

        if reason_col and req.reason:
            updates.append(f"{reason_col} = %s")
            params.append(req.reason)

        params.append(referral_id)
        cur.execute(
            f"UPDATE referrals SET {', '.join(updates)} WHERE referral_id = %s RETURNING referral_id",
            params,
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Referral not found")

    # Send notification to referring physician
    try:
        with db_cursor() as cur:
            cur.execute(
                """
                SELECT r.patient_id, p.full_name as patient_name,
                       ph.user_id as physician_user_id
                FROM referrals r
                JOIN patients p ON r.patient_id = p.patient_id
                JOIN physicians ph ON r.referring_physician_id = ph.physician_id
                WHERE r.referral_id = %s
                """,
                (referral_id,),
            )
            info = cur.fetchone()
            if info:
                notify_referral_status_changed(
                    referral_id, info["patient_name"],
                    req.status, info["physician_user_id"],
                )
    except Exception as e:
        print(f"[WARN] Email notification failed: {e}")

    return {"success": True, "referral_id": str(referral_id), "status": req.status}


# ---- attachment routes ----

@router.post("/{referral_id}/attachments")
async def upload_attachment(referral_id: int, request: Request, file: UploadFile = File(...)):
    """Upload a file attachment to a referral."""
    # Get uploader user_id from cookie
    uploader_id = request.cookies.get("hrs_user_id", "1")

    # Validate referral exists
    with db_cursor() as cur:
        cur.execute("SELECT 1 FROM referrals WHERE referral_id = %s", (referral_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Referral not found")

    # Validate file type
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed: {ALLOWED_FILE_TYPES}",
        )

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit")

    # Save file
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = UPLOAD_DIR / unique_name
    file_path.write_bytes(content)

    # Record in DB
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO referral_attachments
                (referral_id, file_name, file_path, file_type, file_size_bytes, uploaded_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING attachment_id
            """,
            (referral_id, file.filename, str(file_path), ext, len(content), int(uploader_id)),
        )
        attachment_id = cur.fetchone()["attachment_id"]

    return {
        "success": True,
        "attachment_id": str(attachment_id),
        "file_name": file.filename,
        "file_size_bytes": len(content),
    }


@router.put("/{referral_id}/assign")
def assign_referral(referral_id: int, req: ReferralAssign, request: Request):
    """Assign a referral to a physician (hospital admin action)."""
    # Validate referral exists
    with db_cursor() as cur:
        cur.execute("SELECT referral_id FROM referrals WHERE referral_id = %s", (referral_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Referral not found")

    # Validate physician exists and is active
    with db_cursor() as cur:
        cur.execute(
            "SELECT physician_id FROM physicians WHERE physician_id = %s AND status = 'active'",
            (req.physician_id,),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Physician not found or inactive")

    # Assign
    with db_cursor() as cur:
        cur.execute(
            "UPDATE referrals SET assigned_physician_id = %s WHERE referral_id = %s",
            (req.physician_id, referral_id),
        )

    return {"success": True, "referral_id": str(referral_id), "assigned_physician_id": str(req.physician_id)}


@router.get("/{referral_id}/attachments")
def list_attachments(referral_id: int):
    """List all attachments for a referral."""
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT * FROM referral_attachments
            WHERE referral_id = %s ORDER BY uploaded_at
            """,
            (referral_id,),
        )
        rows = cur.fetchall()

    return [
        {
            "id": str(r["attachment_id"]),
            "file_name": r["file_name"],
            "file_type": r["file_type"],
            "file_size_bytes": r["file_size_bytes"],
            "uploaded_at": r["uploaded_at"].isoformat() if r.get("uploaded_at") else None,
        }
        for r in rows
    ]


@router.get("/attachments/{attachment_id}/download")
def download_attachment(attachment_id: int):
    """Download / view a specific attachment file."""
    with db_cursor() as cur:
        cur.execute(
            "SELECT file_name, file_path, file_type FROM referral_attachments WHERE attachment_id = %s",
            (attachment_id,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Attachment not found")

    file_path = Path(row["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    media_type_map = {
        "pdf": "application/pdf",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }
    media_type = media_type_map.get(row["file_type"], "application/octet-stream")

    return FileResponse(
        path=str(file_path),
        filename=row["file_name"],
        media_type=media_type,
    )
