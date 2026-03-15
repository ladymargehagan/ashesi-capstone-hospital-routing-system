"""
Hospital routes: list and get hospitals (pre-loaded data).

Hospitals are pre-loaded in the database. Registration is no longer needed.
Only read endpoints + minor admin operations remain.
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException

from controllers.hospital_controller import get_hospitals_list, get_hospital_details

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])


@router.get("")
def list_hospitals(status: Optional[str] = None, level: Optional[str] = None):
    """List hospitals, optionally filtered by status and/or level."""
    return get_hospitals_list(status, level)


@router.get("/{hospital_id}")
def get_hospital(hospital_id: int):
    """Get a single hospital with its resources and specialist counts."""
    hospital = get_hospital_details(hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital
