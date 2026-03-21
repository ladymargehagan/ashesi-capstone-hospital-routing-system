"""
Hospital resource routes: list, create, and update.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from controllers.resource_controller import get_hospital_resources, modify_resource, create_hospital_resource
from core.auth import get_current_user, require_role

router = APIRouter(prefix="/api/resources", tags=["resources"])


# ---- models ----

class ResourceUpdate(BaseModel):
    total_count: Optional[int] = None
    available_count: Optional[int] = None
    is_available: Optional[bool] = None


# ---- routes ----

@router.get("/{hospital_id}")
def list_resources(
    hospital_id: int,
    current_user: dict = Depends(get_current_user),
):
    """List resources for a hospital. Any authenticated user."""
    return get_hospital_resources(hospital_id)


@router.put("/{resource_id}")
def update_resource(
    resource_id: int,
    req: ResourceUpdate,
    current_user: dict = Depends(require_role("hospital_admin", "super_admin")),
):
    """Update a resource's counts or availability. Hospital admin only."""
    result = modify_resource(resource_id, req.model_dump(exclude_unset=True), actor_user_id=current_user["id"])
    if result.get("error"):
        if result.get("message") == "No fields to update":
            raise HTTPException(status_code=400, detail=result["message"])
        raise HTTPException(status_code=404, detail=result["message"])
    return {"success": True, "resource_id": str(resource_id)}


@router.post("/{hospital_id}")
def add_resource(
    hospital_id: int,
    req: dict,
    current_user: dict = Depends(require_role("hospital_admin", "super_admin")),
):
    """Add a new resource to a hospital. Hospital admin only."""
    return create_hospital_resource(hospital_id, req)
