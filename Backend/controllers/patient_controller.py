from typing import Optional

from models.patient import fetch_patients, fetch_patient_by_id, insert_patient
from models.hospital import fetch_hospital_by_id


def _row_to_patient(row) -> dict:
    return {
        "id": str(row["patient_id"]),
        "physician_id": str(row["physician_id"]),
        "hospital_id": str(row["hospital_id"]),
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


def get_patients_list(physician_id: Optional[int] = None, hospital_id: Optional[int] = None, strict_rule: bool = False) -> list[dict]:
    """Retrieve and format a list of patients."""
    rows = fetch_patients(physician_id, hospital_id, strict_rule)
    return [_row_to_patient(r) for r in rows]


def get_patient_details(patient_id: int) -> Optional[dict]:
    """Retrieve a single patient by ID."""
    row = fetch_patient_by_id(patient_id)
    if not row:
        return None
    return _row_to_patient(row)


def create_new_patient(data: dict) -> dict:
    """Validate data and insert a new patient."""
    hospital_id = data.get("hospital_id")
    
    # Validation: Verify hospital exists and is active
    hospital = fetch_hospital_by_id(hospital_id)
    if not hospital or hospital.get("status") != "active":
        return {"error": True, "message": "Invalid hospital"}

    patient_id = insert_patient(
        physician_id=data["physician_id"],
        hospital_id=hospital_id,
        patient_identifier=data["patient_identifier"],
        full_name=data["full_name"],
        date_of_birth=data.get("date_of_birth"),
        sex=data.get("sex"),
        nhis_number=data.get("nhis_number"),
        nhis_status=data.get("nhis_status"),
        contact_number=data.get("contact_number"),
        address=data.get("address"),
        next_of_kin_name=data.get("next_of_kin_name"),
        next_of_kin_contact=data.get("next_of_kin_contact")
    )

    return {"success": True, "patient_id": str(patient_id)}
