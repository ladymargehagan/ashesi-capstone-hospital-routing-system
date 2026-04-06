import smtplib
import socket
import traceback

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.auth import require_role
from models.health import get_system_health_summary, get_hospital_health_summary, execute_system_audit
from core.db import db_cursor

router = APIRouter()


class TestEmailRequest(BaseModel):
    to_email: str
    subject: Optional[str] = "HRS Email Test"


@router.post("/test-email")
def test_email(req: TestEmailRequest, current_user: dict = Depends(require_role("super_admin"))):
    """
    Diagnose SMTP configuration by attempting each delivery method
    and returning detailed pass/fail results for every step.
    """
    from services.email_service import _get_smtp_config

    smtp_host, smtp_port, smtp_user, smtp_password, smtp_from = _get_smtp_config()

    report = {
        "config": {
            "smtp_host": smtp_host,
            "smtp_port": smtp_port,
            "smtp_user": smtp_user[:4] + "..." if smtp_user else "EMPTY",
            "smtp_password_len": len(smtp_password) if smtp_password else 0,
            "smtp_from": smtp_from or "EMPTY",
        },
        "steps": [],
        "final_status": "pending",
    }

    def step(name: str, ok: bool, detail: str):
        report["steps"].append({"step": name, "ok": ok, "detail": detail})

    # 1. Config presence check
    if not smtp_user or not smtp_password:
        step("config_check", False, "SMTP_USER or SMTP_PASSWORD is empty")
        report["final_status"] = "failed"
        return report
    step("config_check", True, "Credentials present")

    # 2. DNS resolution
    try:
        ip = socket.gethostbyname(smtp_host)
        step("dns_resolve", True, f"{smtp_host} → {ip}")
    except Exception as e:
        step("dns_resolve", False, str(e))
        report["final_status"] = "failed"
        return report

    # 3. TCP connect on port 465
    try:
        s = socket.create_connection((smtp_host, 465), timeout=10)
        s.close()
        step("tcp_connect_465", True, "Port 465 reachable")
    except Exception as e:
        step("tcp_connect_465", False, str(e))

    # 4. TCP connect on port 587
    try:
        s = socket.create_connection((smtp_host, 587), timeout=10)
        s.close()
        step("tcp_connect_587", True, "Port 587 reachable")
    except Exception as e:
        step("tcp_connect_587", False, str(e))

    # 5. Try SSL login on 465
    ssl_ok = False
    try:
        with smtplib.SMTP_SSL(smtp_host, 465, timeout=10) as server:
            server.login(smtp_user, smtp_password)
        step("smtp_ssl_login_465", True, "Login successful")
        ssl_ok = True
    except smtplib.SMTPAuthenticationError as e:
        step("smtp_ssl_login_465", False, f"Auth failed — bad credentials or App Password required: {e}")
    except Exception as e:
        step("smtp_ssl_login_465", False, f"{type(e).__name__}: {e}")

    # 6. Try STARTTLS login on 587 (only if SSL failed)
    starttls_ok = False
    if not ssl_ok:
        try:
            with smtplib.SMTP(smtp_host, 587, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
            step("smtp_starttls_login_587", True, "Login successful")
            starttls_ok = True
        except smtplib.SMTPAuthenticationError as e:
            step("smtp_starttls_login_587", False, f"Auth failed — bad credentials or App Password required: {e}")
        except Exception as e:
            step("smtp_starttls_login_587", False, f"{type(e).__name__}: {e}")

    if not ssl_ok and not starttls_ok:
        report["final_status"] = "failed"
        return report

    # 7. Actually send the test email
    try:
        from services.email_service import send_email
        sent = send_email(
            req.to_email,
            req.subject,
            "<p>This is a test email from the <strong>HRS Notification Service</strong>. If you received this, email delivery is working correctly.</p>",
        )
        if sent:
            step("send_email", True, f"Email dispatched to {req.to_email}")
            report["final_status"] = "ok"
        else:
            step("send_email", False, "send_email() returned False — check Render logs for SMTP error details")
            report["final_status"] = "failed"
    except Exception as e:
        step("send_email", False, f"{type(e).__name__}: {e}\n{traceback.format_exc()}")
        report["final_status"] = "failed"

    return report

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
