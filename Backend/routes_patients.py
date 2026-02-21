"""
Patient routes: list and create.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from db import db_cursor

router = APIRouter(prefix="/api/patients", tags=["patients"])


# ---- models ----

class CreatePatient(BaseModel):
    physician_id: int
    patient_identifier: str
    full_name: str
    date_of_birth: Optional[str] = None
    sex: Optional[str] = None
    nhis_number: Optional[str] = None
    nhis_status: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    next_of_kin_name: Optional[str] = None
    next_of_kin_contact: Optional[str] = None


# ---- helpers ----

def _row_to_patient(row) -> dict:
    return {
        "id": str(row["patient_id"]),
        "physician_id": str(row["physician_id"]),
        "patient_identifier": row["patient_identifier"],
        "full_name": row["full_name"],
        "date_of_birth": str(row["date_of_birth"]) if row.get("date_of_birth") else None,
        "sex": row.get("sex"),
        "nhis_number": row.get("nhis_number"),
        "nhis_status": row.get("nhis_status"),
        "contact_number": row.get("contact_number"),
        "address": row.get("address"),
        "next_of_kin_name": row.get("next_of_kin_name"),
        "next_of_kin_contact": row.get("next_of_kin_contact"),
        "registered_at": row["registered_at"].isoformat() if row.get("registered_at") else None,
    }


# ---- routes ----

@router.get("")
def list_patients(physician_id: Optional[int] = None):
    with db_cursor() as cur:
        if physician_id:
            cur.execute(
                "SELECT * FROM patients WHERE physician_id = %s ORDER BY registered_at DESC",
                (physician_id,),
            )
        else:
            cur.execute("SELECT * FROM patients ORDER BY registered_at DESC")
        rows = cur.fetchall()
    return [_row_to_patient(r) for r in rows]


@router.get("/{patient_id}")
def get_patient(patient_id: int):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM patients WHERE patient_id = %s", (patient_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _row_to_patient(row)


@router.post("")
def create_patient(req: CreatePatient):
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO patients
                (physician_id, patient_identifier, full_name, date_of_birth,
                 sex, nhis_number, nhis_status, contact_number, address,
                 next_of_kin_name, next_of_kin_contact)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING patient_id
            """,
            (req.physician_id, req.patient_identifier, req.full_name,
             req.date_of_birth, req.sex, req.nhis_number, req.nhis_status,
             req.contact_number, req.address,
             req.next_of_kin_name, req.next_of_kin_contact),
        )
        patient_id = cur.fetchone()["patient_id"]
    return {"success": True, "patient_id": str(patient_id)}
