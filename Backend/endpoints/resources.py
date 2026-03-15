"""
Hospital resource routes: list and update.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from controllers.resource_controller import get_hospital_resources, modify_resource, create_hospital_resource

router = APIRouter(prefix="/api/resources", tags=["resources"])


# ---- models ----

class ResourceUpdate(BaseModel):
    total_count: Optional[int] = None
    available_count: Optional[int] = None
    is_available: Optional[bool] = None


# ---- routes ----

@router.get("/{hospital_id}")
def list_resources(hospital_id: int):
    return get_hospital_resources(hospital_id)


@router.put("/{resource_id}")
def update_resource(resource_id: int, req: ResourceUpdate):
    result = modify_resource(resource_id, req.dict(exclude_unset=True))
    if result.get("error"):
        if result.get("message") == "No fields to update":
            raise HTTPException(status_code=400, detail=result["message"])
        raise HTTPException(status_code=404, detail=result["message"])
        
    return {"success": True, "resource_id": str(resource_id)}


@router.post("/{hospital_id}")
def add_resource(hospital_id: int, req: dict):
    """Add a new resource to a hospital."""
    return create_hospital_resource(hospital_id, req)
