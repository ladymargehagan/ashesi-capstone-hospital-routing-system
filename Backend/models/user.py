from typing import Optional
from core.db import db_cursor


def fetch_users(role: Optional[str] = None, status: Optional[str] = None):
    with db_cursor() as cur:
        query = """
            SELECT u.*, r.role_name, h.name AS hospital_name
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            LEFT JOIN hospitals h ON u.hospital_id = h.hospital_id
            WHERE 1=1
        """
        params = []
        if role:
            query += " AND r.role_name = %s"
            params.append(role)
        if status:
            query += " AND u.status = %s"
            params.append(status)
        query += " ORDER BY u.created_at DESC"
        cur.execute(query, params)
        return cur.fetchall()


def update_user_status_in_db(user_id: int, status: str) -> bool:
    with db_cursor() as cur:
        cur.execute(
            "UPDATE users SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING user_id",
            (status, user_id),
        )
        return cur.fetchone() is not None


def update_physician_status_in_db(user_id: int, status: str):
    with db_cursor() as cur:
        cur.execute(
            "UPDATE physicians SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s",
            (status, user_id),
        )


def fetch_user_name_by_id(user_id: int) -> Optional[str]:
    with db_cursor() as cur:
        cur.execute("SELECT full_name FROM users WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
        return row["full_name"] if row else None


def fetch_physicians(hospital_id: Optional[int] = None, status: Optional[str] = None):
    with db_cursor() as cur:
        query = """
            SELECT p.*, u.full_name, u.email, u.hospital_id, h.name AS hospital_name
            FROM physicians p
            JOIN users u ON p.user_id = u.user_id
            JOIN role r ON u.role_id = r.role_id
            LEFT JOIN hospitals h ON u.hospital_id = h.hospital_id
            WHERE r.role_name = 'physician'
        """
        params = []
        if hospital_id:
            query += " AND u.hospital_id = %s"
            params.append(hospital_id)
        if status:
            query += " AND p.status = %s"
            params.append(status)
        query += " ORDER BY p.created_at DESC"
        cur.execute(query, params)
        return cur.fetchall()


def update_user_profile_in_db(user_id: int, updates: list, params: list) -> bool:
    with db_cursor() as cur:
        cur.execute(
            f"UPDATE users SET {', '.join(updates)} WHERE user_id = %s RETURNING user_id",
            params,
        )
        return cur.fetchone() is not None


def update_physician_profile_in_db(user_id: int, updates: list, params: list):
    with db_cursor() as cur:
        cur.execute(
            f"UPDATE physicians SET {', '.join(updates)} WHERE user_id = %s",
            params,
        )


def toggle_physician_availability_in_db(physician_id: int, availability: bool) -> bool:
    with db_cursor() as cur:
        cur.execute(
            "UPDATE physicians SET availability = %s, updated_at = CURRENT_TIMESTAMP WHERE physician_id = %s RETURNING physician_id",
            (availability, physician_id),
        )
        return cur.fetchone() is not None


def fetch_user_role(user_id: int) -> Optional[str]:
    with db_cursor() as cur:
        cur.execute(
            "SELECT r.role_name FROM users u JOIN role r ON u.role_id = r.role_id WHERE u.user_id = %s",
            (user_id,),
        )
        row = cur.fetchone()
        return row["role_name"] if row else None


def update_user_role_in_db(user_id: int, role_id: int, hospital_id: Optional[int]):
    with db_cursor() as cur:
        cur.execute(
            """
            UPDATE users SET role_id = %s, hospital_id = %s, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
            """,
            (role_id, hospital_id, user_id),
        )
