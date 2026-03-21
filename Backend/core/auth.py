"""
Authentication dependencies for FastAPI.

Usage
-----
# Require any logged-in user
@router.get("/me")
def my_route(current_user: dict = Depends(get_current_user)):
    ...

# Require a specific role (or one of several)
@router.post("/referrals")
def create(current_user: dict = Depends(require_role("physician"))):
    ...

@router.put("/resources/{id}")
def update(current_user: dict = Depends(require_role("hospital_admin", "super_admin"))):
    ...
"""

from __future__ import annotations

from fastapi import Depends, HTTPException, Request

from models.auth import fetch_user_by_id_complete


# ---------------------------------------------------------------------------
# Core dependency
# ---------------------------------------------------------------------------

def get_current_user(request: Request) -> dict:
    """
    Read the hrs_user_id cookie, validate it against the DB, and return the
    user dict (id, email, role, hospital_id, status).

    Raises 401 if the cookie is missing, invalid, or the user doesn't exist /
    is not active.
    """
    user_id_str = request.cookies.get("hrs_user_id")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid session cookie.")

    row = fetch_user_by_id_complete(user_id)
    if not row:
        raise HTTPException(status_code=401, detail="User not found. Please log in again.")

    if row["status"] != "active":
        raise HTTPException(
            status_code=403,
            detail=f"Account is {row['status']}. Contact an administrator."
        )

    return {
        "id": user_id,
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
