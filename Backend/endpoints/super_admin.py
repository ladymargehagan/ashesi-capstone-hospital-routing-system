from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from core.auth import get_current_user, require_role
from core.db import db_cursor
from models.admin_invite import create_admin_invite, get_valid_invite
from services.email_service import send_email, _base_email, EMAIL_ENABLED

router = APIRouter(prefix="/api/super-admin", tags=["super-admin"])

class InviteRequest(BaseModel):
    email: str
    hospital_id: int

@router.post("/invites")
def generate_invite(req: InviteRequest, current_user: dict = Depends(require_role("super_admin"))):
    """Generate a secure invite link for a new hospital admin and email it."""
    token = create_admin_invite(req.email, req.hospital_id, current_user["id"])
    invite_link = f"http://localhost:3000/register?invite={token}"

    # Look up hospital name for the email
    hospital_name = "your assigned hospital"
    with db_cursor() as cur:
        cur.execute("SELECT name FROM hospitals WHERE hospital_id = %s", (req.hospital_id,))
        row = cur.fetchone()
        if row:
            hospital_name = row["name"]

    # Send the invite email
    email_sent = send_email(
        req.email,
        f"[HRS] You've Been Invited — Hospital Admin Registration",
        _base_email(
            "Hospital Admin Invitation",
            f"""
            <p>You have been invited to join the <strong>Hospital Routing System</strong>
            as an administrator for <strong>{hospital_name}</strong>.</p>
            <p>Click the button below to complete your registration. This link expires in 7 days.</p>
            <p style="text-align: center; margin: 24px 0;">
                <a href="{invite_link}"
                   style="background: #1e40af; color: white; padding: 14px 28px;
                          border-radius: 8px; text-decoration: none; display: inline-block;
                          font-weight: 600; font-size: 15px;">
                    Complete Registration
                </a>
            </p>
            <p style="color: #64748b; font-size: 13px;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <span style="word-break: break-all;">{invite_link}</span>
            </p>
            """,
        ),
    )

    return {
        "success": True,
        "message": f"Invite generated for {req.email}",
        "token": token,
        "invite_link": invite_link,
        "email_sent": email_sent,
    }

@router.get("/invites/{token}")
def validate_invite(token: str):
    """Validate a token and return the locked email and hospital_id."""
    invite = get_valid_invite(token)
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")
    return {
        "success": True, 
        "email": invite["email"], 
        "hospital_id": invite["hospital_id"]
    }
