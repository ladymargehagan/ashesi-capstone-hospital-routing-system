from core.db import db_cursor


def fetch_specialists_by_hospital(hospital_id: int):
    with db_cursor() as cur:
        cur.execute(
            "SELECT * FROM specialists WHERE hospital_id = %s ORDER BY specialty",
            (hospital_id,),
        )
        return cur.fetchall()


def insert_specialist(hospital_id: int, specialty: str, specialist_name: str = None, on_call_available: bool = False) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO specialists (hospital_id, specialty, specialist_name, on_call_available)
            VALUES (%s, %s, %s, %s)
            RETURNING specialist_id
            """,
            (hospital_id, specialty, specialist_name, on_call_available),
        )
        return cur.fetchone()["specialist_id"]


def update_specialist_in_db(specialist_id: int, updates: list, params: list) -> bool:
    with db_cursor() as cur:
        cur.execute(
            f"UPDATE specialists SET {', '.join(updates)} WHERE specialist_id = %s RETURNING specialist_id",
            params,
        )
        return cur.fetchone() is not None


def delete_specialist_from_db(specialist_id: int) -> bool:
    with db_cursor() as cur:
        cur.execute(
            "DELETE FROM specialists WHERE specialist_id = %s RETURNING specialist_id",
            (specialist_id,),
        )
        return cur.fetchone() is not None
