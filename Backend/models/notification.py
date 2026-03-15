from core.db import db_cursor


def fetch_notifications_by_user(user_id: int, limit: int = 50):
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
        return cur.fetchall()


def fetch_unread_notification_count(user_id: int) -> int:
    with db_cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = %s AND is_read = FALSE",
            (user_id,),
        )
        row = cur.fetchone()
        return row["cnt"] if row else 0


def update_notification_as_read(notification_id: int, user_id: int) -> bool:
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
        return cur.fetchone() is not None


def update_all_notifications_as_read(user_id: int) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            UPDATE notifications
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE user_id = %s AND is_read = FALSE
            """,
            (user_id,),
        )
        return cur.rowcount
