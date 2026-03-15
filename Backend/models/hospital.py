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
