"""
Specialist routes: CRUD for hospital specialists.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from controllers.specialist_controller import (
    get_hospital_specialists,
    create_new_specialist,
    modify_specialist,
    remove_specialist
)

router = APIRouter(prefix="/api/specialists", tags=["specialists"])


# ---- models ----

class CreateSpecialist(BaseModel):
    hospital_id: int
    specialty: str
    specialist_name: Optional[str] = None
    on_call_available: bool = False


class UpdateSpecialist(BaseModel):
    specialty: Optional[str] = None
    specialist_name: Optional[str] = None
    on_call_available: Optional[bool] = None


# ---- routes ----

@router.get("/{hospital_id}")
def list_specialists(hospital_id: int):
    return get_hospital_specialists(hospital_id)


@router.post("")
def create_specialist(req: CreateSpecialist):
    return create_new_specialist(req.dict())


@router.put("/{specialist_id}")
def update_specialist(specialist_id: int, req: UpdateSpecialist):
    result = modify_specialist(specialist_id, req.dict(exclude_unset=True))
    if result.get("error"):
        if result.get("message") == "No fields to update":
            raise HTTPException(status_code=400, detail=result["message"])
        raise HTTPException(status_code=404, detail=result["message"])
        
    return {"success": True, "specialist_id": str(specialist_id)}


@router.delete("/{specialist_id}")
def delete_specialist(specialist_id: int):
    result = remove_specialist(specialist_id)
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["message"])
    return {"success": True}
