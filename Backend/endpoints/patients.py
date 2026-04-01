"""
Patient routes: list, get, create.

Patients are visible to:
  - The physician who registered them
  - The hospital where they are registered
  - Any receiving hospital with an active referral for that patient
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from controllers.patient_controller import get_patients_list, get_patient_details, create_new_patient
from core.auth import get_current_user, require_role

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


# ---- routes ----

@router.get("")
def list_patients(
    physician_id: Optional[int] = None,
    hospital_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    List patients.
    Doctors ONLY see patients referred out by them OR assigned to them.
    Admins see hospital specific or all.
    """
    if current_user.get("role") == "physician":
        my_phys_id = current_user.get("physician_id")
        return get_patients_list(my_phys_id, None, strict_rule=True)
        
    return get_patients_list(physician_id, hospital_id)


@router.get("/{patient_id}")
def get_patient(
    patient_id: int,
    current_user: dict = Depends(get_current_user),
):
    patient = get_patient_details(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Physicians can only view their own patients
    if current_user.get("role") == "physician":
        my_phys_id = current_user.get("physician_id")
        my_patients = get_patients_list(my_phys_id, None, strict_rule=True)
        if not any(p["id"] == str(patient_id) for p in my_patients):
            raise HTTPException(status_code=403, detail="Access denied")

    return patient


@router.post("")
def create_patient(
    req: CreatePatient,
    current_user: dict = Depends(require_role("physician")),
):
    """Create a patient record. Physicians only."""
    result = create_new_patient(req.model_dump())
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return {"success": True, "patient_id": result["patient_id"]}
