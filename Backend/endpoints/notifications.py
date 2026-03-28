"""
Notification routes: list, mark as read, mark all as read.

Notifications are tied to the currently logged-in user (from JWT).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from core.auth import get_current_user
from controllers.notification_controller import (
    get_user_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ---- routes ----

@router.get("")
def list_notifications(current_user: dict = Depends(get_current_user), limit: int = 50):
    return get_user_notifications(current_user["id"], limit)


@router.get("/unread-count")
def unread_count(current_user: dict = Depends(get_current_user)):
    return get_unread_count(current_user["id"])


@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: int, current_user: dict = Depends(get_current_user)):
    result = mark_as_read(notification_id, current_user["id"])
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@router.put("/read-all")
def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    return mark_all_as_read(current_user["id"])
