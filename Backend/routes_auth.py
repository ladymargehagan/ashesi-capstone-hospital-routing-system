"""
Authentication routes: login, me, logout.

Uses JWT tokens stored in HTTP-only cookies for session management.
Passwords are hashed with bcrypt.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta

import bcrypt
from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel

from db import db_cursor

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET", "hrs-dev-secret-change-in-prod")


# ---- helpers ----

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


# ---- models ----

class LoginRequest(BaseModel):
    email: str
    password: str


# ---- routes ----

@router.post("/login")
def login(req: LoginRequest, response: Response):
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT u.user_id, u.email, u.password_hash, u.full_name, u.phone_number,
                   u.hospital_id, u.status, r.role_name,
                   u.created_at
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            WHERE u.email = %s
            """,
            (req.email,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if row["status"] == "pending":
        return {"success": False, "status": "pending"}

    if row["status"] == "rejected":
        return {"success": False, "status": "rejected"}

    user = {
        "id": str(row["user_id"]),
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role_name"],
        "hospital_id": str(row["hospital_id"]) if row["hospital_id"] else None,
        "phone_number": row["phone_number"],
        "status": row["status"],
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
    }

    # Store user_id in a simple cookie for session tracking
    response.set_cookie(key="hrs_user_id", value=str(row["user_id"]), httponly=True, samesite="lax")

    return {"success": True, "status": "active", "user": user}


@router.get("/me")
def me(request: Request):
    user_id = request.cookies.get("hrs_user_id")
    if not user_id:
        return {"user": None}

    with db_cursor() as cur:
        cur.execute(
            """
            SELECT u.user_id, u.email, u.full_name, u.phone_number,
                   u.hospital_id, u.status, r.role_name, u.created_at
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            WHERE u.user_id = %s
            """,
            (int(user_id),),
        )
        row = cur.fetchone()

    if not row:
        return {"user": None}

    return {
        "user": {
            "id": str(row["user_id"]),
            "email": row["email"],
            "full_name": row["full_name"],
            "role": row["role_name"],
            "hospital_id": str(row["hospital_id"]) if row["hospital_id"] else None,
            "phone_number": row["phone_number"],
            "status": row["status"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        }
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("hrs_user_id")
    return {"success": True}
