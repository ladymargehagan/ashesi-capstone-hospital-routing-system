import json
import uuid
import os
from pathlib import Path
from datetime import datetime
from typing import Optional

from models.referral import (
    fetch_referrals,
    fetch_referral_metadata,
    fetch_referral_details_db,
    insert_referral,
    insert_referral_details,
    check_referral_exists,
    update_referral_status_in_db,
    fetch_referral_status_info,
    assign_referral_to_physician,
    check_physician_exists_and_active,
    insert_attachment,
    fetch_attachments,
    fetch_attachment_by_id
)
from models.patient import fetch_patient_by_id
from services.email_service import notify_referral_created, notify_referral_status_changed
from utils.audit import log_action


# Same serialization logic from the original monolithic route
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
            "id": str(patient.get("patient_id") or patient.get("id")),
            "full_name": patient.get("full_name"),
            "date_of_birth": str(patient["date_of_birth"]) if patient.get("date_of_birth") else None,
            "sex": patient.get("sex"),
            "nhis_number": patient.get("nhis_number"),
            "nhis_status": patient.get("nhis_status"),
            "contact_number": patient.get("contact_number"),
            "address": patient.get("address"),
            "next_of_kin_name": patient.get("next_of_kin_name"),
            "next_of_kin_contact": patient.get("next_of_kin_contact"),
        }
        # Convenience fields
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


def get_referrals_list(
    physician_id: Optional[int] = None,
    hospital_id: Optional[int] = None,
    assigned_physician_id: Optional[int] = None,
    status: Optional[str] = None,
) -> list[dict]:
    rows = fetch_referrals(physician_id, hospital_id, assigned_physician_id, status)
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


def get_single_referral(referral_id: int) -> Optional[dict]:
    row = fetch_referral_metadata(referral_id)
    if not row:
        return None

    details = fetch_referral_details_db(referral_id)
    patient = fetch_patient_by_id(row["patient_id"])
    attachments = fetch_attachments(referral_id)

    return _row_to_referral(row, details=details, patient=patient, attachments=attachments)


def process_create_referral(req_data: dict) -> dict:
    from api import _load_hospitals_from_db
    from services.referral_engine import ReferralEngine, EngineConfig, PatientCase
    from core.db import db_cursor

    # Get lat/lon of referring hospital
    with db_cursor() as cur:
        cur.execute("SELECT gps_coordinates FROM hospitals WHERE hospital_id = %s", (req_data["referring_hospital_id"],))
        row = cur.fetchone()
        lat, lon = 5.56, -0.20
        if row and row.get("gps_coordinates"):
            gps = row["gps_coordinates"]
            if isinstance(gps, str):
                parts = gps.strip("()").split(",")
                lat, lon = float(parts[0]), float(parts[1])
            elif isinstance(gps, tuple):
                lat, lon = float(gps[0]), float(gps[1])
        
    now = datetime.utcnow()
    hospitals = _load_hospitals_from_db(now)
    engine = ReferralEngine(hospitals, config=EngineConfig(top_k=5))
    patient = PatientCase(
        lat=lat, lon=lon, emergency_type=req_data["emergency_type"],
        severity=req_data["severity"], stability=req_data["stability"], at_time=now
    )
    res = engine.rank(patient)
    
    routing_queue = []
    for r in res.get("recommendations", []):
        hid = str(r["hospital_id"])
        if hid != str(req_data["receiving_hospital_id"]) and hid != str(req_data["referring_hospital_id"]):
            routing_queue.append(hid)

    referral_id = insert_referral(
        req_data["patient_id"], req_data["referring_physician_id"], req_data["referring_hospital_id"],
        req_data["receiving_hospital_id"], req_data["severity"], req_data["stability"],
        req_data["emergency_type"], req_data.get("estimated_arrival_minutes"), json.dumps(routing_queue)
    )

    insert_referral_details(
        referral_id, req_data["presenting_complaint"], req_data.get("clinical_history"),
        req_data.get("initial_diagnosis"), req_data.get("current_condition"), req_data.get("clinical_summary"),
        req_data.get("examination_findings"), req_data.get("working_diagnosis"), req_data.get("reason_for_referral"),
        req_data.get("investigations_done"), req_data.get("treatment_given"), req_data.get("additional_notes"),
        req_data.get("required_specialist"), req_data.get("required_facility")
    )

    try:
        p = fetch_patient_by_id(req_data["patient_id"])
        patient_name = p["full_name"] if p else "Unknown"
        notify_referral_created(referral_id, patient_name, req_data["receiving_hospital_id"])
    except Exception as e:
        print(f"[WARN] Email notification failed: {e}")

    log_action(
        req_data["referring_physician_id"],
        "referral_created",
        entity_type="referral",
        entity_id=int(referral_id),
        details={
            "patient_id": req_data["patient_id"],
            "receiving_hospital_id": req_data["receiving_hospital_id"],
            "emergency_type": req_data["emergency_type"],
            "severity": req_data["severity"],
        },
    )

    return {"success": True, "referral_id": str(referral_id)}


def modify_referral_status(referral_id: int, status: str, reason: str = None) -> dict:
    valid_statuses = {"pending", "approved", "rejected", "en_route", "completed", "cancelled"}
    if status not in valid_statuses:
        return {"error": True, "code": 400, "message": f"Status must be one of: {valid_statuses}"}

    ts_col = {
        "approved": "approved_at",
        "rejected": "rejected_at",
        "arrived": "arrived_at",
        "completed": "completed_at",
        "cancelled": "cancelled_at",
    }.get(status)

    reason_col = {
        "rejected": "rejection_reason",
        "cancelled": "cancellation_reason",
    }.get(status)

    updates = ["status = %s"]
    params = [status]

    if ts_col:
        updates.append(f"{ts_col} = CURRENT_TIMESTAMP")
    if reason_col and reason:
        updates.append(f"{reason_col} = %s")
        params.append(reason)
    
    params.append(referral_id)
    success = update_referral_status_in_db(referral_id, updates, params)

    if not success:
        return {"error": True, "code": 404, "message": "Referral not found"}

    try:
        info = fetch_referral_status_info(referral_id)
        if info:
            notify_referral_status_changed(
                referral_id, info["patient_name"], status, info["physician_user_id"]
            )
            log_action(
                info["physician_user_id"],
                "referral_status_changed",
                entity_type="referral",
                entity_id=referral_id,
                details={"new_status": status, "reason": reason},
            )
    except Exception as e:
        print(f"[WARN] Email notification failed: {e}")

    return {"success": True, "referral_id": str(referral_id), "status": status}


def handle_referral_assignment(referral_id: int, physician_id: int) -> dict:
    if not check_referral_exists(referral_id):
        return {"error": True, "code": 404, "message": "Referral not found"}
        
    if not check_physician_exists_and_active(physician_id):
        return {"error": True, "code": 404, "message": "Physician not found or inactive"}

    assign_referral_to_physician(referral_id, physician_id)
    return {"success": True, "referral_id": str(referral_id), "assigned_physician_id": str(physician_id)}


def handle_attachment_upload(referral_id: int, filename: str, content_bytes: bytes, uploader_id: int, upload_dir: Path) -> dict:
    if not check_referral_exists(referral_id):
        return {"error": True, "code": 404, "message": "Referral not found"}

    ext = filename.rsplit(".", 1)[-1].lower() if filename else ""
    allowed_types = {"pdf", "jpg", "jpeg", "png", "webp"}
    if ext not in allowed_types:
        return {"error": True, "code": 400, "message": f"File type '{ext}' not allowed. Allowed: {allowed_types}"}

    unique_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = upload_dir / unique_name
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content_bytes)

    attachment_id = insert_attachment(
        referral_id, filename, str(file_path), ext, len(content_bytes), uploader_id
    )

    return {
        "success": True,
        "attachment_id": str(attachment_id),
        "file_name": filename,
        "file_size_bytes": len(content_bytes),
    }


def get_referral_attachments_list(referral_id: int) -> list[dict]:
    rows = fetch_attachments(referral_id)
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


def get_attachment_file_data(attachment_id: int) -> dict:
    row = fetch_attachment_by_id(attachment_id)
    if not row:
        return {"error": True, "code": 404, "message": "Attachment not found"}

    file_path = Path(row["file_path"])
    if not file_path.exists():
        return {"error": True, "code": 404, "message": "File not found on disk"}

    media_type_map = {
        "pdf": "application/pdf",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }
    media_type = media_type_map.get(row["file_type"], "application/octet-stream")

    return {
        "success": True,
        "path": str(file_path),
        "filename": row["file_name"],
        "media_type": media_type
    }
