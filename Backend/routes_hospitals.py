"""
Hospital routes: list and get hospitals (pre-loaded data).

Hospitals are pre-loaded in the database. Registration is no longer needed.
Only read endpoints + minor admin operations remain.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from typing import Optional

from db import db_cursor

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])


# ---- helpers ----

def _row_to_hospital(row) -> dict:
    gps = row.get("gps_coordinates")
    lat, lng = None, None
    if gps:
        if isinstance(gps, str):
            gps = gps.strip("()")
            parts = gps.split(",")
            lat, lng = float(parts[0]), float(parts[1])
        elif isinstance(gps, tuple):
            lat, lng = float(gps[0]), float(gps[1])

    return {
        "id": str(row["hospital_id"]),
        "name": row["name"],
        "license_number": row.get("license_number"),
        "address": row["address"],
        "gps_coordinates": {"lat": lat, "lng": lng} if lat is not None else None,
        "level": row.get("level"),
        "type": row["type"],
        "ownership": row["ownership"],
        "operating_hours": row.get("operating_hours"),
        "contact_phone": row.get("contact_phone"),
        "email": row.get("email"),
        "status": row["status"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


# ---- routes ----

@router.get("")
def list_hospitals(
    status: Optional[str] = None,
    level: Optional[str] = None,
):
    """List hospitals, optionally filtered by status and/or level."""
    with db_cursor() as cur:
        query = "SELECT * FROM hospitals WHERE 1=1"
        params: list = []
        if status:
            query += " AND status = %s"
            params.append(status)
        if level:
            query += " AND level = %s"
            params.append(level)
        query += " ORDER BY name"
        cur.execute(query, params)
        rows = cur.fetchall()
    return [_row_to_hospital(r) for r in rows]


@router.get("/{hospital_id}")
def get_hospital(hospital_id: int):
    """Get a single hospital with its resources and specialist counts."""
    with db_cursor() as cur:
        cur.execute("SELECT * FROM hospitals WHERE hospital_id = %s", (hospital_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Hospital not found")

    hospital = _row_to_hospital(row)

    # Attach resource summary
    with db_cursor() as cur:
        cur.execute(
            "SELECT resource_type, total_count, available_count, is_available FROM hospital_resources WHERE hospital_id = %s",
            (hospital_id,),
        )
        hospital["resources"] = [dict(r) for r in cur.fetchall()]

    # Attach specialist count
    with db_cursor() as cur:
        cur.execute(
            "SELECT specialty, specialist_name, on_call_available FROM specialists WHERE hospital_id = %s",
            (hospital_id,),
        )
        hospital["specialists"] = [dict(r) for r in cur.fetchall()]

    return hospital
