"""
Specialist routes: CRUD for hospital specialists.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from db import db_cursor

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


# ---- helpers ----

def _row_to_specialist(row) -> dict:
    return {
        "id": str(row["specialist_id"]),
        "hospital_id": str(row["hospital_id"]),
        "specialty": row["specialty"],
        "specialist_name": row.get("specialist_name"),
        "on_call_available": row.get("on_call_available", False),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


# ---- routes ----

@router.get("/{hospital_id}")
def list_specialists(hospital_id: int):
    with db_cursor() as cur:
        cur.execute(
            "SELECT * FROM specialists WHERE hospital_id = %s ORDER BY specialty",
            (hospital_id,),
        )
        rows = cur.fetchall()
    return [_row_to_specialist(r) for r in rows]


@router.post("")
def create_specialist(req: CreateSpecialist):
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO specialists (hospital_id, specialty, specialist_name, on_call_available)
            VALUES (%s, %s, %s, %s)
            RETURNING specialist_id
            """,
            (req.hospital_id, req.specialty, req.specialist_name, req.on_call_available),
        )
        specialist_id = cur.fetchone()["specialist_id"]
    return {"success": True, "specialist_id": str(specialist_id)}


@router.put("/{specialist_id}")
def update_specialist(specialist_id: int, req: UpdateSpecialist):
    with db_cursor() as cur:
        updates = []
        params = []
        if req.specialty is not None:
            updates.append("specialty = %s")
            params.append(req.specialty)
        if req.specialist_name is not None:
            updates.append("specialist_name = %s")
            params.append(req.specialist_name)
        if req.on_call_available is not None:
            updates.append("on_call_available = %s")
            params.append(req.on_call_available)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(specialist_id)
        cur.execute(
            f"UPDATE specialists SET {', '.join(updates)} WHERE specialist_id = %s RETURNING specialist_id",
            params,
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Specialist not found")

    return {"success": True, "specialist_id": str(specialist_id)}


@router.delete("/{specialist_id}")
def delete_specialist(specialist_id: int):
    with db_cursor() as cur:
        cur.execute(
            "DELETE FROM specialists WHERE specialist_id = %s RETURNING specialist_id",
            (specialist_id,),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Specialist not found")
    return {"success": True}
