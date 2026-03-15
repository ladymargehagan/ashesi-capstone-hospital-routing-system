"""
Notification routes: list, mark as read, mark all as read.

Notifications are tied to the currently logged-in user (read from cookie).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from controllers.notification_controller import (
    get_user_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _get_current_user_id(request: Request) -> int:
    """Extract user_id from the hrs_user_id cookie."""
    user_id_str = request.cookies.get("hrs_user_id")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid session")


# ---- routes ----

@router.get("")
def list_notifications(request: Request, limit: int = 50):
    user_id = _get_current_user_id(request)
    return get_user_notifications(user_id, limit)


@router.get("/unread-count")
def unread_count(request: Request):
    user_id = _get_current_user_id(request)
    return get_unread_count(user_id)


@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: int, request: Request):
    user_id = _get_current_user_id(request)
    result = mark_as_read(notification_id, user_id)
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@router.put("/read-all")
def mark_all_notifications_read(request: Request):
    user_id = _get_current_user_id(request)
    return mark_all_as_read(user_id)
