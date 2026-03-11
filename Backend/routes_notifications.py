"""
Notification routes: list, mark as read, mark all as read.

Notifications are tied to the currently logged-in user (read from cookie).
All notification creation is handled by email_service.notify_user() which
is called from routes_referrals.py and routes_users.py automatically.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from db import db_cursor

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _get_current_user_id(request: Request) -> int:
    """Extract user_id from the hrs_user_id cookie (set during login)."""
    user_id_str = request.cookies.get("hrs_user_id")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid session")


def _row_to_notification(row) -> dict:
    return {
        "id": str(row["notification_id"]),
        "user_id": str(row["user_id"]),
        "message": row["message"],
        "type": row["type"],
        "is_read": row["is_read"],
        "email_sent": row.get("email_sent", False),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "read_at": row["read_at"].isoformat() if row.get("read_at") else None,
    }


# ---- routes ----

@router.get("")
def list_notifications(request: Request, limit: int = 50):
    """List all notifications for the current user, newest first."""
    user_id = _get_current_user_id(request)
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT * FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (user_id, limit),
        )
        rows = cur.fetchall()
    return [_row_to_notification(r) for r in rows]


@router.get("/unread-count")
def get_unread_count(request: Request):
    """Return just the unread notification count — used for badge polling."""
    user_id = _get_current_user_id(request)
    with db_cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = %s AND is_read = FALSE",
            (user_id,),
        )
        row = cur.fetchone()
    return {"unread_count": row["cnt"] if row else 0}


@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: int, request: Request):
    """Mark a single notification as read."""
    user_id = _get_current_user_id(request)
    with db_cursor() as cur:
        cur.execute(
            """
            UPDATE notifications
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE notification_id = %s AND user_id = %s
            RETURNING notification_id
            """,
            (notification_id, user_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}


@router.put("/read-all")
def mark_all_notifications_read(request: Request):
    """Mark all notifications for the current user as read."""
    user_id = _get_current_user_id(request)
    with db_cursor() as cur:
        cur.execute(
            """
            UPDATE notifications
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE user_id = %s AND is_read = FALSE
            """,
            (user_id,),
        )
        count = cur.rowcount
    return {"success": True, "marked_read": count}
