from typing import Optional
from services.email_service import notify_account_approved, notify_account_rejected
from utils.audit import log_action

from models.user import (
    fetch_users,
    update_user_status_in_db,
    update_physician_status_in_db,
    fetch_user_name_by_id,
    fetch_physicians,
    update_user_profile_in_db,
    update_physician_profile_in_db,
    toggle_physician_availability_in_db,
    fetch_user_role,
    update_user_role_in_db
)
from models.auth import fetch_role_id_by_name
from models.hospital import fetch_hospital_by_id


def _row_to_user(row) -> dict:
    return {
        "id": str(row["user_id"]),
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row.get("role_name", ""),
        "hospital_id": str(row["hospital_id"]) if row.get("hospital_id") else None,
        "hospital_name": row.get("hospital_name"),
        "phone_number": row.get("phone_number"),
        "auth_provider": row.get("auth_provider", "local"),
        "profile_picture_url": row.get("profile_picture_url"),
        "status": row["status"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


def _row_to_physician(row) -> dict:
    return {
        "id": str(row["physician_id"]),
        "user_id": str(row["user_id"]),
        "hospital_id": str(row["hospital_id"]),
        "hospital_name": row.get("hospital_name"),
        "license_number": row.get("license_number"),
        "title": row.get("title"),
        "specialization": row.get("specialization"),
        "department": row.get("department"),
        "grade": row.get("grade"),
        "availability": row.get("availability", False),
        "status": row["status"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "full_name": row.get("full_name"),
        "email": row.get("email"),
    }


def get_all_users(role: Optional[str] = None, status: Optional[str] = None) -> list[dict]:
    rows = fetch_users(role, status)
    return [_row_to_user(r) for r in rows]


def get_all_physicians(hospital_id: Optional[int] = None, status: Optional[str] = None) -> list[dict]:
    rows = fetch_physicians(hospital_id, status)
    return [_row_to_physician(r) for r in rows]


def toggle_physician_availability(physician_id: int, availability: bool, actor_user_id: int) -> dict:
    success = toggle_physician_availability_in_db(physician_id, availability)
    if not success:
        return {"error": True, "message": "Physician not found"}
    log_action(
        actor_user_id, "physician_availability_toggled",
        entity_type="physician", entity_id=physician_id,
        details={"availability": availability},
    )
    return {"success": True, "physician_id": str(physician_id), "availability": availability}


def change_user_status(user_id: int, status: str) -> dict:
    success = update_user_status_in_db(user_id, status)
    if not success:
        return {"error": True, "message": "User not found"}

    # If this user is a physician, also update the PHYSICIANS table
    update_physician_status_in_db(user_id, status)

    # Send notification email for status changes
    if status in ("active", "rejected"):
        full_name = fetch_user_name_by_id(user_id)
        if full_name:
            try:
                if status == "active":
                    notify_account_approved(user_id, full_name)
                else:
                    notify_account_rejected(user_id, full_name)
            except Exception as e:
                print(f"[WARN] Account status notification failed: {e}")

    log_action(user_id, "user_status_changed", entity_type="user", entity_id=user_id, details={"status": status})
    return {"success": True, "user_id": str(user_id), "status": status}


def modify_user_profile(user_id: int, data: dict) -> dict:
    """Update user profile fields (name, phone) and physician fields if applicable."""
    # 1. Update users table
    user_updates = []
    user_params = []
    if data.get("first_name") is not None:
        user_updates.append("first_name = %s")
        user_params.append(data["first_name"])
    if data.get("last_name") is not None:
        user_updates.append("last_name = %s")
        user_params.append(data["last_name"])
    if data.get("phone_number") is not None:
        user_updates.append("phone_number = %s")
        user_params.append(data["phone_number"])

    if user_updates:
        user_updates.append("updated_at = CURRENT_TIMESTAMP")
        user_params.append(user_id)
        success = update_user_profile_in_db(user_id, user_updates, user_params)
        if not success:
            return {"error": True, "message": "User not found"}

    # 2. Update physicians table
    physician_updates = []
    physician_params = []
    if data.get("title") is not None:
        physician_updates.append("title = %s")
        physician_params.append(data["title"])
    if data.get("license_number") is not None:
        physician_updates.append("license_number = %s")
        physician_params.append(data["license_number"])
    if data.get("specialization") is not None:
        physician_updates.append("specialization = %s")
        physician_params.append(data["specialization"])
    if data.get("department") is not None:
        physician_updates.append("department = %s")
        physician_params.append(data["department"])
    if data.get("grade") is not None:
        physician_updates.append("grade = %s")
        physician_params.append(data["grade"])
        
    if physician_updates:
        physician_updates.append("updated_at = CURRENT_TIMESTAMP")
        physician_params.append(user_id)
        update_physician_profile_in_db(user_id, physician_updates, physician_params)

    if not user_updates and not physician_updates:
        return {"error": True, "message": "No fields to update"}
        
    full_name = fetch_user_name_by_id(user_id)
    if full_name:
        from services.email_service import notify_profile_updated
        try:
            notify_profile_updated(user_id, full_name)
        except Exception as e:
            print(f"[WARN] Failed to send profile updated email: {e}")

    return {"success": True, "user_id": str(user_id)}


def change_user_role(target_user_id: int, caller_user_id: int, new_role_name: str, target_hospital_id: Optional[int]) -> dict:
    """Change a user's role (super admin only). Handles physician record lifecycle."""
    caller_role = fetch_user_role(caller_user_id)
    if caller_role != "super_admin":
        return {"error": True, "code": 403, "message": "Only super admins can change roles"}

    # Validate hospital_id if elevating to hospital_admin
    if new_role_name == "hospital_admin" and not target_hospital_id:
        return {"error": True, "code": 400, "message": "hospital_id is required when assigning hospital_admin role"}

    if target_hospital_id:
        hospital = fetch_hospital_by_id(target_hospital_id)
        if not hospital or hospital.get("status") != "active":
            return {"error": True, "code": 400, "message": "Invalid or inactive hospital"}

    current_role = fetch_user_role(target_user_id)
    if not current_role:
        return {"error": True, "code": 404, "message": "User not found"}

    new_role_id = fetch_role_id_by_name(new_role_name)
    if not new_role_id:
        return {"error": True, "code": 400, "message": f"Role '{new_role_name}' not found"}

    # Implement change
    update_user_role_in_db(target_user_id, new_role_id, target_hospital_id)

    # Handle physician record lifecycle
    if current_role == "physician" and new_role_name != "physician":
        # Elevating FROM physician: deactivate physician record
        update_physician_status_in_db(target_user_id, "inactive")
    elif current_role != "physician" and new_role_name == "physician":
        # Demoting TO physician: reactivate physician record if it exists
        update_physician_status_in_db(target_user_id, "active")

    return {"success": True, "user_id": str(target_user_id), "new_role": new_role_name}
