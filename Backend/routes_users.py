"""
User management routes (super admin): list users, update status.
Also includes physician-specific queries.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from db import db_cursor
from email_service import notify_account_approved

router = APIRouter(prefix="/api/users", tags=["users"])


# ---- models ----

class UserStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|rejected)$")


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None


# ---- helpers ----

def _row_to_user(row) -> dict:
    return {
        "id": str(row["user_id"]),
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row.get("role_name", ""),
        "hospital_id": str(row["hospital_id"]) if row.get("hospital_id") else None,
        "hospital_name": row.get("hospital_name"),
        "phone_number": row.get("phone_number"),
        "auth_provider": row.get("auth_provider", "local"),
        "profile_picture_url": row.get("profile_picture_url"),
        "status": row["status"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


def _row_to_physician(row) -> dict:
    return {
        "id": str(row["physician_id"]),
        "user_id": str(row["user_id"]),
        "hospital_id": str(row["hospital_id"]),
        "hospital_name": row.get("hospital_name"),
        "license_number": row.get("license_number"),
        "title": row.get("title"),
        "specialization": row.get("specialization"),
        "department": row.get("department"),
        "grade": row.get("grade"),
        "status": row["status"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "full_name": row.get("full_name"),
        "email": row.get("email"),
    }


# ---- routes ----

@router.get("")
def list_users(role: Optional[str] = None, status: Optional[str] = None):
    with db_cursor() as cur:
        query = """
            SELECT u.*, r.role_name, h.name AS hospital_name
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            LEFT JOIN hospitals h ON u.hospital_id = h.hospital_id
            WHERE 1=1
        """
        params: list = []
        if role:
            query += " AND r.role_name = %s"
            params.append(role)
        if status:
            query += " AND u.status = %s"
            params.append(status)
        query += " ORDER BY u.created_at DESC"
        cur.execute(query, params)
        rows = cur.fetchall()
    return [_row_to_user(r) for r in rows]


@router.put("/{user_id}/status")
def update_user_status(user_id: int, req: UserStatusUpdate):
    with db_cursor() as cur:
        cur.execute(
            "UPDATE users SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING user_id",
            (req.status, user_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")

        # If this user is a physician, also update the PHYSICIANS table
        cur.execute(
            "UPDATE physicians SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s",
            (req.status, user_id),
        )

    return {"success": True, "user_id": str(user_id), "status": req.status}


@router.get("/physicians")
def list_physicians(hospital_id: Optional[int] = None, status: Optional[str] = None):
    """List physicians with user and hospital info."""
    with db_cursor() as cur:
        query = """
            SELECT p.*, u.full_name, u.email, h.name AS hospital_name
            FROM physicians p
            JOIN users u ON p.user_id = u.user_id
            JOIN hospitals h ON p.hospital_id = h.hospital_id
            WHERE 1=1
        """
        params: list = []
        if hospital_id:
            query += " AND p.hospital_id = %s"
            params.append(hospital_id)
        if status:
            query += " AND p.status = %s"
            params.append(status)
        query += " ORDER BY p.created_at DESC"
        cur.execute(query, params)
        rows = cur.fetchall()
    return [_row_to_physician(r) for r in rows]


@router.put("/{user_id}/profile")
def update_user_profile(user_id: int, req: UserProfileUpdate):
    """Update user profile fields (name, phone)."""
    with db_cursor() as cur:
        updates = []
        params = []
        if req.full_name is not None:
            updates.append("full_name = %s")
            params.append(req.full_name)
        if req.phone_number is not None:
            updates.append("phone_number = %s")
            params.append(req.phone_number)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(user_id)
        cur.execute(
            f"UPDATE users SET {', '.join(updates)} WHERE user_id = %s RETURNING user_id",
            params,
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")

    return {"success": True, "user_id": str(user_id)}
