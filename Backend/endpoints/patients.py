"""
Patient routes: list, get, create.

Patients are visible to:
  - The physician who registered them
  - The hospital where they are registered
  - Any receiving hospital with an active referral for that patient
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from controllers.patient_controller import get_patients_list, get_patient_details, create_new_patient

router = APIRouter(prefix="/api/patients", tags=["patients"])


# ---- models ----

class CreatePatient(BaseModel):
    physician_id: int
    hospital_id: int             # NEW: the facility where the patient is registered
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
):
    """
    List patients.
    - physician_id: patients registered by this physician
    - hospital_id: patients at this hospital OR referred to this hospital
    """
    return get_patients_list(physician_id, hospital_id)


@router.get("/{patient_id}")
def get_patient(patient_id: int):
    patient = get_patient_details(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("")
def create_patient(req: CreatePatient):
    result = create_new_patient(req.dict())
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return {"success": True, "patient_id": result["patient_id"]}
