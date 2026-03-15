from models.notification import (
    fetch_notifications_by_user,
    fetch_unread_notification_count,
    update_notification_as_read,
    update_all_notifications_as_read
)


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


def get_user_notifications(user_id: int, limit: int = 50) -> list[dict]:
    """Retrieve and format a list of notifications for a user."""
    rows = fetch_notifications_by_user(user_id, limit)
    return [_row_to_notification(r) for r in rows]


def get_unread_count(user_id: int) -> dict:
    """Get count of unread notifications."""
    count = fetch_unread_notification_count(user_id)
    return {"unread_count": count}


def mark_as_read(notification_id: int, user_id: int) -> dict:
    """Mark a specific notification as read."""
    success = update_notification_as_read(notification_id, user_id)
    if not success:
        return {"error": True, "message": "Notification not found"}
    return {"success": True}


def mark_all_as_read(user_id: int) -> dict:
    """Mark all unread notifications as read for a user."""
    count = update_all_notifications_as_read(user_id)
    return {"success": True, "marked_read": count}
