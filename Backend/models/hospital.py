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
    """Return physicians with a specialization at this hospital, shaped like
    the old specialists table for backward compatibility with the hospital
    profile endpoint."""
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT p.specialization AS specialty,
                   u.full_name     AS specialist_name,
                   p.availability  AS on_call_available
            FROM physicians p
            JOIN users u ON p.user_id = u.user_id
            WHERE u.hospital_id = %s
              AND p.status = 'active'
              AND p.specialization IS NOT NULL
              AND p.specialization != ''
            ORDER BY p.specialization
            """,
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


def insert_hospital(data: dict) -> int:
    """Insert a new hospital."""
    with db_cursor() as cur:
        fields = ["name", "address", "level", "ownership", "contact_phone", "email", "status"]
        if "gps_coordinates" in data:
            fields.append("gps_coordinates")
            
        cols = ", ".join(fields)
        vals_placeholder = ", ".join(["%s"] * len(fields))
        
        params = [data[f] for f in fields]
        
        cur.execute(
            f"INSERT INTO hospitals ({cols}) VALUES ({vals_placeholder}) RETURNING hospital_id",
            params
        )
        return cur.fetchone()["hospital_id"]


def count_active_hospitals() -> int:
    """Return the number of currently active hospitals."""
    with db_cursor() as cur:
        cur.execute("SELECT COUNT(*) as count FROM hospitals WHERE status = 'active'")
        row = cur.fetchone()
        return row["count"] if row else 0


def insert_hospital_flag(hospital_id: int, referral_id: Optional[int], flagging_physician_id: int, category: str, notes: Optional[str] = None) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO hospital_data_flags 
                (hospital_id, referral_id, flagging_physician_id, category, notes)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING flag_id
            """,
            (hospital_id, referral_id, flagging_physician_id, category, notes)
        )
        return cur.fetchone()["flag_id"]


def fetch_active_hospital_flags(hospital_id: int):
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT f.flag_id, f.category, f.notes, f.created_at, u.full_name as flagging_physician_name
            FROM hospital_data_flags f
            JOIN physicians p ON f.flagging_physician_id = p.physician_id
            JOIN users u ON p.user_id = u.user_id
            WHERE f.hospital_id = %s AND f.resolved = FALSE
            ORDER BY f.created_at DESC
            """,
            (hospital_id,)
        )
        return cur.fetchall()
