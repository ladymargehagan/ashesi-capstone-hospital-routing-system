"""
Hospital resource routes: list and update.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from db import db_cursor

router = APIRouter(prefix="/api/resources", tags=["resources"])


# ---- models ----

class ResourceUpdate(BaseModel):
    total_count: Optional[int] = None
    available_count: Optional[int] = None
    is_available: Optional[bool] = None


# ---- helpers ----

def _row_to_resource(row) -> dict:
    return {
        "id": str(row["resource_id"]),
        "hospital_id": str(row["hospital_id"]),
        "resource_type": row["resource_type"],
        "total_count": row["total_count"],
        "available_count": row["available_count"],
        "is_available": row["is_available"],
        "operator_required": row.get("operator_required", False),
        "operator_specialty": row.get("operator_specialty"),
        "last_updated": row["last_updated"].isoformat() if row.get("last_updated") else None,
    }


# ---- routes ----

@router.get("/{hospital_id}")
def list_resources(hospital_id: int):
    with db_cursor() as cur:
        cur.execute(
            "SELECT * FROM hospital_resources WHERE hospital_id = %s ORDER BY resource_type",
            (hospital_id,),
        )
        rows = cur.fetchall()
    return [_row_to_resource(r) for r in rows]


@router.put("/{resource_id}")
def update_resource(resource_id: int, req: ResourceUpdate):
    with db_cursor() as cur:
        updates = []
        params = []

        if req.total_count is not None:
            updates.append("total_count = %s")
            params.append(req.total_count)
        if req.available_count is not None:
            updates.append("available_count = %s")
            params.append(req.available_count)
        if req.is_available is not None:
            updates.append("is_available = %s")
            params.append(req.is_available)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        updates.append("last_updated = CURRENT_TIMESTAMP")
        params.append(resource_id)

        cur.execute(
            f"UPDATE hospital_resources SET {', '.join(updates)} WHERE resource_id = %s RETURNING resource_id",
            params,
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Resource not found")

    return {"success": True, "resource_id": str(resource_id)}


@router.post("/{hospital_id}")
def add_resource(hospital_id: int, req: dict):
    """Add a new resource to a hospital."""
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO hospital_resources
                (hospital_id, resource_type, total_count, available_count, is_available, operator_required, operator_specialty)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING resource_id
            """,
            (hospital_id, req.get("resource_type"), req.get("total_count"),
             req.get("available_count"), req.get("is_available", True),
             req.get("operator_required", False), req.get("operator_specialty")),
        )
        resource_id = cur.fetchone()["resource_id"]
    return {"success": True, "resource_id": str(resource_id)}
