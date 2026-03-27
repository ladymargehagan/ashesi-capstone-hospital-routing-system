from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from core.auth import get_current_user, require_role
from models.admin_invite import create_admin_invite, get_valid_invite

router = APIRouter(prefix="/api/super-admin", tags=["super-admin"])

class InviteRequest(BaseModel):
    email: str
    hospital_id: int

@router.post("/invites")
def generate_invite(req: InviteRequest, current_user: dict = Depends(require_role("super_admin"))):
    """Generate a secure invite link for a new hospital admin prioritizing this email and hospital."""
    token = create_admin_invite(req.email, req.hospital_id, current_user["id"])
    
    # In a real app we would dispatch an email here via SMTP. 
    invite_link = f"http://localhost:3000/register?invite={token}"
    
    return {
        "success": True, 
        "message": f"Invite generated for {req.email}",
        "token": token, 
        "invite_link": invite_link
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
