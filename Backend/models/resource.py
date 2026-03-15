from core.db import db_cursor


def fetch_resources_by_hospital(hospital_id: int):
    with db_cursor() as cur:
        cur.execute(
            "SELECT * FROM hospital_resources WHERE hospital_id = %s ORDER BY resource_type",
            (hospital_id,),
        )
        return cur.fetchall()


def update_resource_in_db(resource_id: int, updates: list, params: list) -> bool:
    with db_cursor() as cur:
        cur.execute(
            f"UPDATE hospital_resources SET {', '.join(updates)} WHERE resource_id = %s RETURNING resource_id",
            params,
        )
        return cur.fetchone() is not None


def insert_resource(
    hospital_id: int,
    resource_type: str,
    total_count: int,
    available_count: int,
    is_available: bool = True,
    operator_required: bool = False,
    operator_specialty: str = None,
) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO hospital_resources
                (hospital_id, resource_type, total_count, available_count, is_available, operator_required, operator_specialty)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING resource_id
            """,
            (hospital_id, resource_type, total_count, available_count,
             is_available, operator_required, operator_specialty),
        )
        return cur.fetchone()["resource_id"]
