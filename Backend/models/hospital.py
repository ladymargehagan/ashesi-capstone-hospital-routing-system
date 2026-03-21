from typing import Optional

from core.db import db_cursor


def fetch_all_hospitals(status: Optional[str] = None, level: Optional[str] = None):
    with db_cursor() as cur:
        query = "SELECT * FROM hospitals WHERE 1=1"
        params: list = []
        if status:
            query += " AND status = %s"
            params.append(status)
        if level:
            query += " AND level = %s"
            params.append(level)
        query += " ORDER BY name"
        cur.execute(query, params)
        rows = cur.fetchall()
    return rows


def fetch_hospital_by_id(hospital_id: int):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM hospitals WHERE hospital_id = %s", (hospital_id,))
        row = cur.fetchone()
    return row


def fetch_hospital_resources(hospital_id: int):
    with db_cursor() as cur:
        cur.execute(
            "SELECT resource_type, total_count, available_count, is_available FROM hospital_resources WHERE hospital_id = %s",
            (hospital_id,),
        )
        return cur.fetchall()


def fetch_hospital_specialists(hospital_id: int):
    with db_cursor() as cur:
        cur.execute(
            "SELECT specialty, specialist_name, on_call_available FROM specialists WHERE hospital_id = %s",
            (hospital_id,),
        )
        return cur.fetchall()


# ---------------------------------------------------------------------------
# Write functions (Stage 3)
# ---------------------------------------------------------------------------

def update_hospital_in_db(hospital_id: int, updates: list, params: list) -> bool:
    """Run a parameterised UPDATE on the hospitals table."""
    with db_cursor() as cur:
        sql = f"UPDATE hospitals SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE hospital_id = %s"
        cur.execute(sql, params)
        return cur.rowcount > 0


def set_hospital_status(hospital_id: int, status: str) -> bool:
    """Toggle hospital active/inactive status."""
    with db_cursor() as cur:
        cur.execute(
            "UPDATE hospitals SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE hospital_id = %s",
            (status, hospital_id),
        )
        return cur.rowcount > 0


def count_active_hospitals() -> int:
    """Return the number of currently active hospitals."""
    with db_cursor() as cur:
        cur.execute("SELECT COUNT(*) as count FROM hospitals WHERE status = 'active'")
        row = cur.fetchone()
        return row["count"] if row else 0
