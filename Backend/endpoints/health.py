from fastapi import APIRouter, Depends, HTTPException
from core.security import require_role
from models.health import get_system_health_summary, get_hospital_health_summary, execute_system_audit
from core.db import db_cursor

router = APIRouter()

@router.get("/summary")
def get_global_health_summary(current_user: dict = Depends(require_role("super_admin"))):
    """Fetch health summary for all hospitals."""
    try:
        return get_system_health_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary/{hospital_id}")
def get_single_hospital_health(hospital_id: int, current_user: dict = Depends(require_role("hospital_admin", "super_admin"))):
    """Fetch health summary for a single hospital."""
    if current_user["role"] == "hospital_admin" and str(current_user.get("hospital_id")) != str(hospital_id):
        raise HTTPException(status_code=403, detail="Not authorized to view health data for this hospital.")
    
    try:
        result = get_hospital_health_summary(hospital_id)
        if not result:
            raise HTTPException(status_code=404, detail="Hospital not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run-audit")
def trigger_system_audit(current_user: dict = Depends(require_role("super_admin"))):
    """Manually trigger the system-wide health audit. Generates alerts."""
    try:
        return execute_system_audit(current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
def get_system_alerts(current_user: dict = Depends(require_role("super_admin"))):
    """Fetch recent audit and system alerts from the audit logs."""
    try:
        with db_cursor() as cur:
            cur.execute("""
                SELECT log_id, action, details, created_at 
                FROM audit_logs 
                WHERE action = 'SYSTEM_AUDIT'
                ORDER BY created_at DESC
                LIMIT 50
            """)
            logs = cur.fetchall()
            
            return [{
                "log_id": l["log_id"],
                "action": l["action"],
                "details": l["details"],
                "created_at": l["created_at"].isoformat() if l["created_at"] else None
            } for l in logs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
