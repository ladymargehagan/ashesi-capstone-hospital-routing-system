"""
Referral routes: list, create, update status.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional

from db import db_cursor

router = APIRouter(prefix="/api/referrals", tags=["referrals"])


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
    # Referral details
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


# ---- helpers ----

def _row_to_referral(row, details=None) -> dict:
    result = {
        "id": str(row["referral_id"]),
        "patient_id": str(row["patient_id"]),
        "referring_physician_id": str(row["referring_physician_id"]),
        "referring_hospital_id": str(row["referring_hospital_id"]),
        "receiving_hospital_id": str(row["receiving_hospital_id"]),
        "status": row["status"],
        "severity": row["severity"],
        "stability": row["stability"],
        "emergency_type": row.get("emergency_type", "general"),
        "estimated_arrival_minutes": row.get("estimated_arrival_minutes"),
        "submitted_at": row["submitted_at"].isoformat() if row.get("submitted_at") else None,
        "approved_at": row["approved_at"].isoformat() if row.get("approved_at") else None,
        "completed_at": row["completed_at"].isoformat() if row.get("completed_at") else None,
        # Joined fields
        "patient_name": row.get("patient_name"),
        "referring_physician_name": row.get("referring_physician_name"),
        "referring_hospital_name": row.get("referring_hospital_name"),
        "receiving_hospital_name": row.get("receiving_hospital_name"),
    }
    if details:
        result["details"] = {
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
    return result


# ---- routes ----

@router.get("")
def list_referrals(
    physician_id: Optional[int] = None,
    hospital_id: Optional[int] = None,
    status: Optional[str] = None,
):
    """List referrals, filtered by physician or hospital."""
    with db_cursor() as cur:
        query = """
            SELECT r.*,
                   p.full_name AS patient_name,
                   u.full_name AS referring_physician_name,
                   rh.name AS referring_hospital_name,
                   recvh.name AS receiving_hospital_name
            FROM referrals r
            JOIN patients p ON r.patient_id = p.patient_id
            JOIN physicians ph ON r.referring_physician_id = ph.physician_id
            JOIN users u ON ph.user_id = u.user_id
            JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
            JOIN hospitals recvh ON r.receiving_hospital_id = recvh.hospital_id
            WHERE 1=1
        """
        params: list = []

        if physician_id:
            query += " AND r.referring_physician_id = %s"
            params.append(physician_id)
        if hospital_id:
            query += " AND (r.referring_hospital_id = %s OR r.receiving_hospital_id = %s)"
            params.extend([hospital_id, hospital_id])
        if status:
            query += " AND r.status = %s"
            params.append(status)

        query += " ORDER BY r.submitted_at DESC"
        cur.execute(query, params)
        rows = cur.fetchall()

    return [_row_to_referral(r) for r in rows]


@router.get("/{referral_id}")
def get_referral(referral_id: int):
    """Get a single referral with its details."""
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT r.*,
                   p.full_name AS patient_name,
                   u.full_name AS referring_physician_name,
                   rh.name AS referring_hospital_name,
                   recvh.name AS receiving_hospital_name
            FROM referrals r
            JOIN patients p ON r.patient_id = p.patient_id
            JOIN physicians ph ON r.referring_physician_id = ph.physician_id
            JOIN users u ON ph.user_id = u.user_id
            JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
            JOIN hospitals recvh ON r.receiving_hospital_id = recvh.hospital_id
            WHERE r.referral_id = %s
            """,
            (referral_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Referral not found")

        cur.execute("SELECT * FROM referral_details WHERE referral_id = %s", (referral_id,))
        details = cur.fetchone()

    return _row_to_referral(row, details)


@router.post("")
def create_referral(req: CreateReferral):
    """Create a new referral + referral details."""
    import traceback
    try:
        with db_cursor() as cur:
            cur.execute(
                """
                INSERT INTO referrals
                    (patient_id, referring_physician_id, referring_hospital_id,
                     receiving_hospital_id, severity, stability, emergency_type,
                     estimated_arrival_minutes, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING referral_id
                """,
                (req.patient_id, req.referring_physician_id, req.referring_hospital_id,
                 req.receiving_hospital_id, req.severity, req.stability,
                 req.emergency_type, req.estimated_arrival_minutes),
            )
            referral_id = cur.fetchone()["referral_id"]

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

        return {"success": True, "referral_id": str(referral_id)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{referral_id}/status")
def update_referral_status(referral_id: int, req: ReferralStatusUpdate):
    """Update referral status (approve, reject, complete, cancel)."""
    with db_cursor() as cur:
        # Build update query based on status
        updates = ["status = %s"]
        params = [req.status]

        if req.status == "approved":
            updates.append("approved_at = CURRENT_TIMESTAMP")
        elif req.status == "rejected":
            updates.append("rejected_at = CURRENT_TIMESTAMP")
            if req.reason:
                updates.append("rejection_reason = %s")
                params.append(req.reason)
        elif req.status == "completed":
            updates.append("completed_at = CURRENT_TIMESTAMP")
        elif req.status == "cancelled":
            updates.append("cancelled_at = CURRENT_TIMESTAMP")
            if req.reason:
                updates.append("cancellation_reason = %s")
                params.append(req.reason)

        params.append(referral_id)
        cur.execute(
            f"UPDATE referrals SET {', '.join(updates)} WHERE referral_id = %s RETURNING referral_id",
            params,
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Referral not found")

    return {"success": True, "referral_id": str(referral_id), "status": req.status}
