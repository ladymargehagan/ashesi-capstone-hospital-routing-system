"""
Authentication dependencies for FastAPI — Supabase JWT edition.

Usage
-----
# Require any logged-in user (active only)
@router.get("/me")
def my_route(current_user: dict = Depends(get_current_user)):
    ...

# Require a specific role (or one of several)
@router.post("/referrals")
def create(current_user: dict = Depends(require_role("physician"))):
    ...

# Allow any status (for /me endpoint where pending users check their status)
@router.get("/me")
def my_profile(current_user: dict = Depends(get_current_user_any_status)):
    ...
"""

from __future__ import annotations

import os

import jwt
from fastapi import Depends, HTTPException, Request

from models.auth import fetch_user_by_auth_uid, fetch_user_by_id_complete

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def _extract_auth_uid(request: Request) -> str:
    """Extract and verify the Supabase auth UID from the Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")

    token = auth_header[7:]  # strip "Bearer "
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token. Please log in again.")

    auth_uid = payload.get("sub")
    if not auth_uid:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    return auth_uid


# ---------------------------------------------------------------------------
# Core dependencies
# ---------------------------------------------------------------------------

def get_current_user(request: Request) -> dict:
    """
    Validate the Supabase JWT, look up the user in public.users by auth_uid,
    and return the user dict. Requires status == 'active'.
    """
    auth_uid = _extract_auth_uid(request)

    row = fetch_user_by_auth_uid(auth_uid)
    if not row:
        raise HTTPException(status_code=401, detail="User not found. Please complete registration.")

    if row["status"] != "active":
        raise HTTPException(
            status_code=403,
            detail=f"Account is {row['status']}. Contact an administrator."
        )

    return {
        "id": row["user_id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row.get("role_name", ""),
        "hospital_id": row.get("hospital_id"),
        "status": row["status"],
    }


def get_current_user_any_status(request: Request) -> dict:
    """
    Same as get_current_user but does NOT enforce active status.
    Used for /me endpoint so pending doctors can check their status.
    """
    auth_uid = _extract_auth_uid(request)

    row = fetch_user_by_auth_uid(auth_uid)
    if not row:
        return {"auth_uid": auth_uid, "not_registered": True}

    return {
        "id": row["user_id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row.get("role_name", ""),
        "hospital_id": row.get("hospital_id"),
        "status": row["status"],
    }


# ---------------------------------------------------------------------------
# Role-based dependency factory
# ---------------------------------------------------------------------------

def require_role(*allowed_roles: str):
    """
    Returns a FastAPI dependency that ensures the current user has one of the
    specified roles.

    Example:
        Depends(require_role("hospital_admin", "super_admin"))
    """
    def _check(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Access denied. Required role(s): {', '.join(allowed_roles)}. "
                    f"Your role: {current_user['role']}."
                ),
            )
        return current_user

    return _check
