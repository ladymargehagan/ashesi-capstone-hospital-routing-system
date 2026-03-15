from typing import Optional

from models.hospital import (
    fetch_all_hospitals,
    fetch_hospital_by_id,
    fetch_hospital_resources,
    fetch_hospital_specialists,
)


def _row_to_hospital(row) -> dict:
    gps = row.get("gps_coordinates")
    lat, lng = None, None
    if gps:
        if isinstance(gps, str):
            gps = gps.strip("()")
            parts = gps.split(",")
            lat, lng = float(parts[0]), float(parts[1])
        elif isinstance(gps, tuple):
            lat, lng = float(gps[0]), float(gps[1])

    return {
        "id": str(row["hospital_id"]),
        "name": row["name"],
        "license_number": row.get("license_number"),
        "address": row["address"],
        "gps_coordinates": {"lat": lat, "lng": lng} if lat is not None else None,
        "level": row.get("level"),
        "type": row["type"],
        "ownership": row["ownership"],
        "operating_hours": row.get("operating_hours"),
        "contact_phone": row.get("contact_phone"),
        "email": row.get("email"),
        "status": row["status"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


def get_hospitals_list(status: Optional[str] = None, level: Optional[str] = None) -> list[dict]:
    """Retrieve and format a list of hospitals."""
    rows = fetch_all_hospitals(status, level)
    return [_row_to_hospital(r) for r in rows]


def get_hospital_details(hospital_id: int) -> Optional[dict]:
    """Retrieve a single hospital with its resources and specialists attached."""
    row = fetch_hospital_by_id(hospital_id)
    if not row:
        return None

    hospital = _row_to_hospital(row)

    # Attach resource summary
    resources = fetch_hospital_resources(hospital_id)
    hospital["resources"] = [dict(r) for r in resources]

    # Attach specialist count
    specialists = fetch_hospital_specialists(hospital_id)
    hospital["specialists"] = [dict(r) for r in specialists]

    return hospital
