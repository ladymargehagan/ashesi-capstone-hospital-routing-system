from models.specialist import (
    fetch_specialists_by_hospital,
    insert_specialist,
    update_specialist_in_db,
    delete_specialist_from_db
)


def _row_to_specialist(row) -> dict:
    return {
        "id": str(row["specialist_id"]),
        "hospital_id": str(row["hospital_id"]),
        "specialty": row["specialty"],
        "specialist_name": row.get("specialist_name"),
        "on_call_available": row.get("on_call_available", False),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


def get_hospital_specialists(hospital_id: int) -> list[dict]:
    """Retrieve and format a list of specialists for a hospital."""
    rows = fetch_specialists_by_hospital(hospital_id)
    return [_row_to_specialist(r) for r in rows]


def create_new_specialist(data: dict) -> dict:
    """Validate and insert a new specialist."""
    specialist_id = insert_specialist(
        hospital_id=data["hospital_id"],
        specialty=data["specialty"],
        specialist_name=data.get("specialist_name"),
        on_call_available=data.get("on_call_available", False)
    )
    return {"success": True, "specialist_id": str(specialist_id)}


def modify_specialist(specialist_id: int, data: dict) -> dict:
    """Validate and update an existing specialist."""
    updates = []
    params = []

    if data.get("specialty") is not None:
        updates.append("specialty = %s")
        params.append(data["specialty"])
    if data.get("specialist_name") is not None:
        updates.append("specialist_name = %s")
        params.append(data["specialist_name"])
    if data.get("on_call_available") is not None:
        updates.append("on_call_available = %s")
        params.append(data["on_call_available"])

    if not updates:
        return {"error": True, "message": "No fields to update"}

    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(specialist_id)

    success = update_specialist_in_db(specialist_id, updates, params)
    
    if not success:
        return {"error": True, "message": "Specialist not found"}

    return {"success": True, "specialist_id": str(specialist_id)}


def remove_specialist(specialist_id: int) -> dict:
    """Delete a specialist."""
    success = delete_specialist_from_db(specialist_id)
    if not success:
        return {"error": True, "message": "Specialist not found"}
    return {"success": True}
