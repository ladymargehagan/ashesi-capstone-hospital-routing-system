"""
Hospital routes: list, get, register, update status.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from db import db_cursor
from routes_auth import hash_password

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])


# ---- models ----

class HospitalRegistration(BaseModel):
    hospital_name: str
    license_number: str
    address: str
    tier: str
    type: str
    ownership: str
    operating_hours: Optional[str] = None
    contact_phone: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    admin_full_name: str
    admin_email: str
    admin_phone: Optional[str] = None
    admin_password: str


class StatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|rejected)$")


# ---- helpers ----

def _row_to_hospital(row) -> dict:
    gps = row.get("gps_coordinates")
    lat, lng = None, None
    if gps:
        # POINT type comes as "(x,y)" string from psycopg2
        if isinstance(gps, str):
            gps = gps.strip("()")
            parts = gps.split(",")
            lat, lng = float(parts[0]), float(parts[1])
        elif isinstance(gps, tuple):
            lat, lng = float(gps[0]), float(gps[1])

    return {
        "id": str(row["hospital_id"]),
        "name": row["name"],
        "license_number": row["license_number"],
        "address": row["address"],
        "gps_coordinates": {"lat": lat, "lng": lng} if lat is not None else None,
        "tier": row["tier"],
        "type": row["type"],
        "ownership": row["ownership"],
        "operating_hours": row.get("operating_hours"),
        "contact_phone": row.get("contact_phone"),
        "status": row["status"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


# ---- routes ----

@router.get("")
def list_hospitals(status: Optional[str] = None):
    with db_cursor() as cur:
        if status:
            cur.execute("SELECT * FROM hospitals WHERE status = %s ORDER BY name", (status,))
        else:
            cur.execute("SELECT * FROM hospitals ORDER BY name")
        rows = cur.fetchall()
    return [_row_to_hospital(r) for r in rows]


@router.get("/{hospital_id}")
def get_hospital(hospital_id: int):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM hospitals WHERE hospital_id = %s", (hospital_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return _row_to_hospital(row)


@router.post("/register")
def register_hospital(req: HospitalRegistration):
    """Register a new hospital + create an admin user. Both start as 'pending'."""
    with db_cursor() as cur:
        # Check duplicate license
        cur.execute("SELECT 1 FROM hospitals WHERE license_number = %s", (req.license_number,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="License number already registered")

        # Check duplicate email
        cur.execute("SELECT 1 FROM users WHERE email = %s", (req.admin_email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Insert hospital
        gps_point = f"({req.gps_lat},{req.gps_lng})" if req.gps_lat and req.gps_lng else "(0,0)"
        cur.execute(
            """
            INSERT INTO hospitals (name, license_number, gps_coordinates, address, tier, type, ownership, operating_hours, contact_phone, status)
            VALUES (%s, %s, %s::point, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING hospital_id
            """,
            (req.hospital_name, req.license_number, gps_point, req.address,
             req.tier, req.type, req.ownership, req.operating_hours, req.contact_phone),
        )
        hospital_id = cur.fetchone()["hospital_id"]

        # Get hospital_admin role_id
        cur.execute("SELECT role_id FROM role WHERE role_name = 'hospital_admin'")
        role_row = cur.fetchone()
        if not role_row:
            raise HTTPException(status_code=500, detail="hospital_admin role not found. Run seed.py first.")
        role_id = role_row["role_id"]

        # Insert admin user
        pw_hash = hash_password(req.admin_password)
        cur.execute(
            """
            INSERT INTO users (email, password_hash, role_id, full_name, phone_number, hospital_id, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending')
            RETURNING user_id
            """,
            (req.admin_email, pw_hash, role_id, req.admin_full_name, req.admin_phone, hospital_id),
        )
        user_id = cur.fetchone()["user_id"]

    return {
        "success": True,
        "hospital_id": str(hospital_id),
        "user_id": str(user_id),
        "message": "Registration submitted. Awaiting admin approval.",
    }


@router.put("/{hospital_id}/status")
def update_hospital_status(hospital_id: int, req: StatusUpdate):
    """Approve or reject a hospital (super admin). Also updates the admin user status."""
    with db_cursor() as cur:
        cur.execute(
            "UPDATE hospitals SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE hospital_id = %s RETURNING hospital_id",
            (req.status, hospital_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Hospital not found")

        # Also update the admin user(s) for this hospital
        cur.execute(
            """
            UPDATE users SET status = %s, updated_at = CURRENT_TIMESTAMP
            WHERE hospital_id = %s AND role_id = (SELECT role_id FROM role WHERE role_name = 'hospital_admin')
            """,
            (req.status, hospital_id),
        )

    return {"success": True, "hospital_id": str(hospital_id), "status": req.status}


@router.delete("/{hospital_id}")
def delete_hospital(hospital_id: int):
    """Remove a hospital and all associated data (super admin)."""
    with db_cursor() as cur:
        # Verify hospital exists
        cur.execute("SELECT hospital_id FROM hospitals WHERE hospital_id = %s", (hospital_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Hospital not found")

        # Delete in dependency order
        cur.execute("DELETE FROM referrals WHERE referring_hospital_id = %s OR receiving_hospital_id = %s", (hospital_id, hospital_id))
        cur.execute("DELETE FROM hospital_resources WHERE hospital_id = %s", (hospital_id,))
        cur.execute("DELETE FROM specialists WHERE hospital_id = %s", (hospital_id,))
        cur.execute("DELETE FROM physicians WHERE hospital_id = %s", (hospital_id,))
        cur.execute("DELETE FROM users WHERE hospital_id = %s", (hospital_id,))
        cur.execute("DELETE FROM hospitals WHERE hospital_id = %s", (hospital_id,))

    return {"success": True, "hospital_id": str(hospital_id)}
