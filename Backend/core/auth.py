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
import json

import jwt
from jwt import PyJWK
import requests as http_requests
from fastapi import Depends, HTTPException, Request

from models.auth import fetch_user_by_auth_uid, fetch_user_by_id_complete

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJob3hwcHl2YmRvbndobnJ3bWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDEwMDUsImV4cCI6MjA5MDI3NzAwNX0.pB_J6i0Db2GWSDNpnXQBe4vIjuJZlTnRrN-xJAvVu3E",
)

# Cache the JWKS public key so we don't fetch it on every request
_jwks_cache: dict | None = None


def _get_jwks_key():
    """Fetch the Supabase JWKS public key for ES256 verification (cached)."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    try:
        resp = http_requests.get(
            f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json",
            headers={"apikey": SUPABASE_ANON_KEY},
            timeout=10,
        )
        resp.raise_for_status()
        jwks_data = resp.json()
        key_data = jwks_data["keys"][0]
        _jwks_cache = PyJWK(key_data).key
        return _jwks_cache
    except Exception as e:
        print(f"[WARN] Failed to fetch JWKS: {e}")
        return None


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def _extract_auth_uid(request: Request) -> str:
    """Extract and verify the Supabase auth UID from the Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")

    token = auth_header[7:]  # strip "Bearer "

    # Peek at the header to determine the algorithm
    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token format.")

    alg = unverified_header.get("alg", "HS256")

    try:
        if alg == "ES256":
            # Asymmetric — verify with JWKS public key
            public_key = _get_jwks_key()
            if not public_key:
                raise HTTPException(status_code=500, detail="Could not load JWT verification key.")
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            # HS256 fallback — verify with shared secret
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token. Please log in again.")

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
        "physician_id": row.get("physician_id"),
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
        "physician_id": row.get("physician_id"),
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
