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
from services.email_service import notify_referral_created, notify_referral_status_changed, notify_user
from utils.audit import log_action


def _get_backup_suggestions(referral_row: dict) -> list:
    """
    When all cascade options are exhausted, run one more engine pass with a
    wider radius — so the physician always has something to look at.
    The system is decision support; a blank result is never acceptable.
    """
    try:
        from api import _load_hospitals_from_db
        from services.referral_engine import ReferralEngine, EngineConfig, PatientCase
        now = datetime.utcnow()
        hospitals = _load_hospitals_from_db(now)
        # Expand the search window from 16km to 40km and ask for up to 5 partial matches
        engine = ReferralEngine(hospitals, config=EngineConfig(radius_km=40, top_k=5))
        patient = PatientCase(
            lat=float(referral_row.get("incident_lat") or 5.56),
            lon=float(referral_row.get("incident_lon") or -0.20),
            referral_reason=referral_row.get("referral_reason", "general"),
            severity=referral_row.get("severity", "medium"),
            stability=referral_row.get("stability", "stable"),
            at_time=now,
        )
        result = engine.rank(patient)
        return result.get("recommendations", [])
    except Exception as e:
        print(f"[WARN] Backup suggestion engine pass failed: {e}")
        return []


def _notify_no_capacity(physician_user_id: int, referral_id: int, patient_name: str, backup_msg: str):
    """Tell the physician that all 5 routing options were rejected, with backup alternatives."""
    notify_user(
        user_id=physician_user_id,
        message=(
            f"Referral #{referral_id} for {patient_name}: all recommended hospitals are at capacity."
            f"{backup_msg} Please review and re-submit or contact a hospital directly."
        ),
        notification_type="referral_no_capacity",
    )


# Converts a raw DB row into the dict shape the frontend expects
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
        "referral_reason": row.get("referral_reason", "general"),
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
    patient_id: Optional[int] = None,
    status: Optional[str] = None,
) -> list[dict]:
    try:
        rows = fetch_referrals(physician_id, hospital_id, assigned_physician_id, patient_id, status)
    except Exception as e:
        print(f"[ERROR] Failed to fetch referrals: {e}")
        return []
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
    from controllers.patient_controller import create_new_patient
    
    # Check if this is a new patient onboarding
    patient_id = req_data.get("patient_id")
    if int(patient_id) == -1 and req_data.get("patient_details"):
        pd = req_data["patient_details"]
        # Deduplication check: Do we already have this patient by NHIS or Identifier?
        with db_cursor() as cur:
            nhis = pd.get("nhis_number")
            pid_str = pd.get("patient_identifier")
            query = "SELECT patient_id FROM patients WHERE "
            conditions = []
            params = []
            if nhis and nhis != "None":
                conditions.append("nhis_number = %s")
                params.append(nhis)
            if pid_str:
                conditions.append("patient_identifier = %s")
                params.append(pid_str)
            if not conditions:
                # Fallback check by name and dob
                conditions.append("(full_name = %s AND date_of_birth = %s)")
                params.extend([pd.get("full_name"), pd.get("date_of_birth")])
            
            cur.execute(query + " OR ".join(conditions) + " LIMIT 1", params)
            existing_row = cur.fetchone()
            if existing_row:
                patient_id = existing_row["patient_id"]
            else:
                # Actually create
                res = create_new_patient(pd)
                if res.get("error"):
                    return res
                patient_id = int(res["patient_id"])
        
        req_data["patient_id"] = patient_id

    # Use custom incident location if provided, else fallback to referring hospital's lat/lon
    lat = req_data.get("incident_lat")
    lon = req_data.get("incident_lon")
    
    if lat is None or lon is None:
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
        lat=lat, lon=lon, referral_reason=req_data["referral_reason"],
        severity=req_data["severity"], stability=req_data["stability"], at_time=now
    )
    res = engine.rank(patient)
    
    routing_queue = []
    for r in res.get("recommendations", []):
        hid = str(r["hospital_id"])
        if hid != str(req_data["receiving_hospital_id"]) and hid != str(req_data["referring_hospital_id"]):
            routing_queue.append(hid)

    routing_metadata_json = json.dumps(res.get("recommendations", []))

    referral_id = insert_referral(
        req_data["patient_id"], req_data["referring_physician_id"], req_data["referring_hospital_id"],
        req_data["receiving_hospital_id"], req_data["severity"], req_data["stability"],
        req_data["referral_reason"], req_data.get("estimated_arrival_minutes"), json.dumps(routing_queue),
        urgency_level=req_data.get("urgency_level", "routine"),
        known_allergies=req_data.get("known_allergies"),
        pre_existing_conditions=req_data.get("pre_existing_conditions"),
        incident_lat=req_data.get("incident_lat"), incident_lon=req_data.get("incident_lon"),
        routing_metadata=routing_metadata_json
    )

    vitals_json = json.dumps(req_data["vital_signs"]) if req_data.get("vital_signs") else None

    insert_referral_details(
        referral_id, req_data["presenting_complaint"], req_data.get("clinical_history"),
        req_data.get("initial_diagnosis"), req_data.get("current_condition"), req_data.get("clinical_summary"),
        req_data.get("examination_findings"), req_data.get("working_diagnosis"), req_data.get("reason_for_referral"),
        req_data.get("investigations_done"), req_data.get("treatment_given"), req_data.get("additional_notes"),
        req_data.get("required_specialist"), req_data.get("required_facility"), vitals_json
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
            "referral_reason": req_data["referral_reason"],
            "severity": req_data["severity"],
        },
    )

    return {"success": True, "referral_id": str(referral_id)}


def modify_referral_status(referral_id: int, status: str, reason: str = None) -> dict:
    # 'arrived' and 'no_capacity' were missing — both are real states in the lifecycle
    valid_statuses = {"pending", "approved", "rejected", "en_route", "arrived", "completed", "cancelled", "no_capacity"}
    if status not in valid_statuses:
        return {"error": True, "code": 400, "message": f"Status must be one of: {valid_statuses}"}

    existing = fetch_referral_metadata(referral_id)
    if not existing:
        return {"error": True, "code": 404, "message": "Referral not found"}

    info = fetch_referral_status_info(referral_id)
    physician_user_id = info["physician_user_id"] if info else existing["referring_physician_id"]
    patient_name = info["patient_name"] if info else "Unknown patient"

    # --- Cascade logic: when a hospital rejects, auto-reroute to the next in the queue ---
    if status == "rejected":
        routing_queue_str = existing.get("routing_queue")
        if routing_queue_str:
            try:
                queue = json.loads(routing_queue_str)

                if queue and len(queue) > 0:
                    # Still have backups — reroute to the next hospital
                    next_hospital_id = int(queue.pop(0))
                    new_queue_str = json.dumps(queue)

                    updates = ["receiving_hospital_id = %s", "status = %s", "routing_queue = %s",
                               "cascade_count = cascade_count + 1"]
                    params = [next_hospital_id, "pending", new_queue_str, referral_id]
                    success = update_referral_status_in_db(referral_id, updates, params)

                    if success:
                        log_action(physician_user_id, "referral_cascaded", entity_type="referral",
                                   entity_id=referral_id,
                                   details={"rejection_reason": reason,
                                            "previous_hospital_id": existing["receiving_hospital_id"],
                                            "new_hospital_id": next_hospital_id})
                        try:
                            notify_referral_created(referral_id, patient_name, next_hospital_id)
                            notify_referral_status_changed(referral_id, patient_name, "cascaded", physician_user_id)
                        except Exception as e:
                            print(f"[WARN] Cascade notification failed: {e}")

                    return {"success": True, "cascaded": True, "referral_id": str(referral_id),
                            "new_hospital_id": str(next_hospital_id)}

                else:
                    # Queue is empty — all 5 options have been tried and rejected.
                    # Run a backup engine pass with expanded radius so the physician
                    # still gets something to work with (system is decision support, not a dead end).
                    backup_suggestions = _get_backup_suggestions(existing)

                    updates = ["status = %s", "rejected_at = CURRENT_TIMESTAMP", "rejection_reason = %s"]
                    params = ["no_capacity", reason or "All recommended hospitals at capacity", referral_id]
                    update_referral_status_in_db(referral_id, updates, params)

                    log_action(physician_user_id, "referral_no_capacity", entity_type="referral",
                               entity_id=referral_id, details={"reason": reason})
                    try:
                        # Notify the physician with the backup suggestions list
                        backup_msg = ""
                        if backup_suggestions:
                            names = ", ".join(s["hospital_name"] for s in backup_suggestions[:3])
                            backup_msg = f" Suggested alternatives to try: {names}."
                        _notify_no_capacity(physician_user_id, referral_id, patient_name, backup_msg)
                    except Exception as e:
                        print(f"[WARN] No-capacity notification failed: {e}")

                    return {"success": True, "no_capacity": True, "referral_id": str(referral_id),
                            "backup_suggestions": backup_suggestions}

            except (json.JSONDecodeError, TypeError):
                pass

    # --- Standard status update (approved, en_route, arrived, completed, cancelled) ---
    ts_col = {
        "approved": "approved_at",
        "rejected": "rejected_at",
        "arrived": "arrived_at",
        "completed": "completed_at",
        "cancelled": "cancelled_at",
    }.get(status)

    reason_col = {"rejected": "rejection_reason", "cancelled": "cancellation_reason"}.get(status)

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
        return {"error": True, "code": 404, "message": "Referral update failed"}

    try:
        if info:
            notify_referral_status_changed(referral_id, patient_name, status, physician_user_id)
            log_action(physician_user_id, "referral_status_changed", entity_type="referral",
                       entity_id=referral_id, details={"new_status": status, "reason": reason})
    except Exception as e:
        print(f"[WARN] Status notification failed: {e}")

    return {"success": True, "referral_id": str(referral_id), "status": status}


def handle_referral_assignment(referral_id: int, physician_id: int, actor_user_id: int = None) -> dict:
    if not check_referral_exists(referral_id):
        return {"error": True, "code": 404, "message": "Referral not found"}
        
    if not check_physician_exists_and_active(physician_id):
        return {"error": True, "code": 404, "message": "Physician not found or inactive"}

    assign_referral_to_physician(referral_id, physician_id)
    
    from core.db import db_cursor
    with db_cursor() as cur:
        cur.execute("SELECT user_id FROM physicians WHERE physician_id = %s", (physician_id,))
        p_user = cur.fetchone()
        if p_user:
            notify_user(
                user_id=p_user["user_id"],
                message=f"You have been assigned to Referral #{referral_id}. Please review the patient's file.",
                notification_type="referral_assigned"
            )
            
    if actor_user_id:
        log_action(actor_user_id, "referral_assigned", entity_type="referral",
                   entity_id=referral_id, details={"assigned_physician_id": physician_id})

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
