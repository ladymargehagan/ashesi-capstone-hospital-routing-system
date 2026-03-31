import os
from typing import Optional

import requests

from models.hospital import (
    fetch_all_hospitals,
    fetch_hospital_by_id,
    fetch_hospital_resources,
    fetch_hospital_specialists,
    update_hospital_in_db,
    set_hospital_status,
    count_active_hospitals,
    fetch_active_hospital_flags,
)
from controllers.resource_controller import create_hospital_resource
from models.admin_invite import create_admin_invite
from utils.audit import log_action


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
        "ownership": row.get("ownership"),
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

    # Attach active flags
    try:
        flags = fetch_active_hospital_flags(hospital_id)
        hospital["active_flags"] = [
            {
                "flag_id": r["flag_id"],
                "category": r["category"],
                "notes": r["notes"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "flagging_physician_name": r["flagging_physician_name"]
            }
            for r in flags
        ]
    except Exception as e:
        print("[WARN] Could not fetch hospital flags:", e)
        hospital["active_flags"] = []

    return hospital


# ---------------------------------------------------------------------------
# Write operations (Stage 3)
# ---------------------------------------------------------------------------

def update_hospital_profile(hospital_id: int, data: dict, actor_user_id: int) -> dict:
    """Validate and update a hospital's profile."""
    updates = []
    params = []

    # Map the JSON keys to DB columns
    fields = ["name", "license_number", "address", "level", "ownership", "operating_hours", "contact_phone", "email"]
    for field in fields:
        if data.get(field) is not None:
            updates.append(f"{field} = %s")
            params.append(data[field])

    if not updates:
        return {"error": True, "message": "No fields to update"}

    params.append(hospital_id)
    
    success = update_hospital_in_db(hospital_id, updates, params)
    
    if not success:
        return {"error": True, "message": "Hospital not found"}

    log_action(
        actor_user_id,
        "hospital_profile_updated",
        entity_type="hospital",
        entity_id=hospital_id,
        details=data,
    )

    return {"success": True, "hospital_id": str(hospital_id)}


def create_new_hospital(data: dict, actor_user_id: int) -> dict:
    """Create a new hospital (inactive by default), geocode its address, set initial resources, and trigger invite."""
    from models.hospital import insert_hospital
    
    admin_email = data.pop("admin_email", None)
    initial_resources = data.pop("initial_resources", [])
    
    # 1. Geocode with Google Maps API
    address = data.get("address", "")
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    lat, lng = None, None
    if address and api_key:
        try:
            res = requests.get(f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={api_key}", timeout=5)
            if res.status_code == 200:
                geo_data = res.json()
                if geo_data.get("results"):
                    loc = geo_data["results"][0]["geometry"]["location"]
                    lat, lng = loc["lat"], loc["lng"]
                    data["gps_coordinates"] = f"({lat},{lng})"
        except Exception as e:
            print(f"[WARN] Failed to geocode hospital address: {e}")
            
    # Default to inactive until checklist clears
    data["status"] = "inactive"
    
    # 2. Track creation
    try:
        hospital_id = insert_hospital(data)
    except Exception as e:
        return {"error": True, "message": f"Database insertion failed: {str(e)}", "code": 500}

    # 3. Add initial resources
    for res_obj in initial_resources:
        create_hospital_resource(hospital_id, res_obj)

    # 4. Generate Admin Invite
    invite_token = None
    if admin_email:
        invite_token = create_admin_invite(admin_email, hospital_id, actor_user_id)
        
    log_action(
        actor_user_id,
        "hospital_created",
        entity_type="hospital",
        entity_id=hospital_id,
        details={"name": data.get("name"), "admin_email": admin_email},
    )

    return {
        "success": True, 
        "hospital_id": str(hospital_id), 
        "geocoded": lat is not None,
        "invite_token": invite_token
    }


def toggle_hospital_status(hospital_id: int, status: str, actor_user_id: int, reason: Optional[str] = None) -> dict:
    """Toggle a hospital between 'active' and 'inactive'."""
    if status == "inactive":
        # Guard: Never deactivate the last active hospital
        if count_active_hospitals() <= 1:
            # Verify if this specific hospital is the one active
            hospital = fetch_hospital_by_id(hospital_id)
            if hospital and hospital["status"] == "active":
                return {"error": True, "code": 400, "message": "Cannot deactivate the last active hospital in the system"}

    success = set_hospital_status(hospital_id, status)
    
    if not success:
        return {"error": True, "code": 404, "message": "Hospital not found"}

    log_action(
        actor_user_id,
        "hospital_status_changed",
        entity_type="hospital",
        entity_id=hospital_id,
        details={"status": status, "reason": reason},
    )

    return {"success": True, "hospital_id": str(hospital_id), "status": status}
