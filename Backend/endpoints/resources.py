"""
Hospital resource routes: list, create, update, and report inaccuracies.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from controllers.resource_controller import get_hospital_resources, modify_resource, create_hospital_resource
from core.auth import get_current_user, require_role
from core.db import db_cursor
from services.email_service import notify_user, _base_email

router = APIRouter(prefix="/api/resources", tags=["resources"])


# ---- models ----

class ResourceUpdate(BaseModel):
    total_count: Optional[int] = None
    available_count: Optional[int] = None
    is_available: Optional[bool] = None


class InaccuracyReport(BaseModel):
    resource_type: str
    notes: str


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


@router.post("/{hospital_id}/report-inaccuracy")
def report_resource_inaccuracy(
    hospital_id: int,
    req: InaccuracyReport,
    current_user: dict = Depends(require_role("physician")),
):
    """
    Allows a physician to report that a resource at their OWN hospital
    is inaccurate. Sends an internal notification to the hospital admin.
    """
    # Only allow physicians to report for their own hospital
    if str(current_user.get("hospital_id")) != str(hospital_id):
        raise HTTPException(
            status_code=403,
            detail="You can only report inaccuracies for your own hospital.",
        )

    physician_name = current_user.get("full_name", "A physician")

    # Notify all hospital admins at this hospital
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT u.user_id, h.name as hospital_name
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            JOIN hospitals h ON h.hospital_id = u.hospital_id
            WHERE u.hospital_id = %s AND r.role_name = 'hospital_admin' AND u.status = 'active'
            """,
            (hospital_id,),
        )
        admins = cur.fetchall()

    if not admins:
        raise HTTPException(status_code=404, detail="No hospital admin found for this hospital.")

    hospital_name = admins[0]["hospital_name"]
    resource_label = req.resource_type.replace("_", " ").title()

    for admin in admins:
        notify_user(
            user_id=admin["user_id"],
            message=f"Dr. {physician_name} reported a data inaccuracy: {resource_label} — {req.notes[:100]}",
            notification_type="data_flagged",
            email_subject=f"[HRS] Resource Inaccuracy Report — {resource_label}",
            email_body=_base_email(
                "Resource Data Inaccuracy Reported",
                f"""
                <p>A physician at <strong>{hospital_name}</strong> has reported
                that resource data may be inaccurate.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; color: #64748b;">Reported By</td>
                        <td style="padding: 8px; font-weight: 600;">Dr. {physician_name}</td></tr>
                    <tr><td style="padding: 8px; color: #64748b;">Resource</td>
                        <td style="padding: 8px; font-weight: 600;">{resource_label}</td></tr>
                    <tr><td style="padding: 8px; color: #64748b; vertical-align: top;">Details</td>
                        <td style="padding: 8px;">{req.notes}</td></tr>
                </table>
                <p>Please review and update the resource data in the HRS dashboard.</p>
                """,
            ),
        )

    return {"success": True, "message": f"Report sent to {len(admins)} hospital admin(s)."}
