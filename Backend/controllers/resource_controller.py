from typing import Optional

from models.resource import fetch_resources_by_hospital, update_resource_in_db, insert_resource
from utils.audit import log_action


def _row_to_resource(row) -> dict:
    return {
        "id": str(row["resource_id"]),
        "hospital_id": str(row["hospital_id"]),
        "resource_type": row["resource_type"],
        "total_count": row["total_count"],
        "available_count": row["available_count"],
        "is_available": row["is_available"],
        "operator_required": row.get("operator_required", False),
        "operator_specialty": row.get("operator_specialty"),
        "last_updated": row["last_updated"].isoformat() if row.get("last_updated") else None,
    }


def get_hospital_resources(hospital_id: int) -> list[dict]:
    """Retrieve and format a list of resources for a hospital."""
    rows = fetch_resources_by_hospital(hospital_id)
    return [_row_to_resource(r) for r in rows]


def modify_resource(resource_id: int, data: dict, actor_user_id: Optional[int] = None) -> dict:
    """Validate and update a resource."""
    updates = []
    params = []

    if data.get("total_count") is not None:
        updates.append("total_count = %s")
        params.append(data["total_count"])
    if data.get("available_count") is not None:
        updates.append("available_count = %s")
        params.append(data["available_count"])
    if data.get("is_available") is not None:
        updates.append("is_available = %s")
        params.append(data["is_available"])

    if not updates:
        return {"error": True, "message": "No fields to update"}

    updates.append("last_updated = CURRENT_TIMESTAMP")
    params.append(resource_id)

    success = update_resource_in_db(resource_id, updates, params)

    if not success:
        return {"error": True, "message": "Resource not found"}

    if actor_user_id:
        log_action(
            actor_user_id,
            "resource_updated",
            entity_type="resource",
            entity_id=resource_id,
            details=data,
        )

    return {"success": True, "resource_id": str(resource_id)}


def create_hospital_resource(hospital_id: int, data: dict) -> dict:
    """Create a new resource for a hospital."""
    resource_id = insert_resource(
        hospital_id=hospital_id,
        resource_type=data.get("resource_type"),
        total_count=data.get("total_count"),
        available_count=data.get("available_count"),
        is_available=data.get("is_available", True),
        operator_required=data.get("operator_required", False),
        operator_specialty=data.get("operator_specialty")
    )
    return {"success": True, "resource_id": str(resource_id)}
