import uuid
from datetime import datetime, timedelta
from core.db import db_cursor

def create_admin_invite(email: str, hospital_id: int, created_by: int) -> str:
    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO admin_invites (email, hospital_id, token, expires_at, created_by)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (email, hospital_id, token, expires_at, created_by)
        )
    return token

def get_valid_invite(token: str) -> dict:
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT invite_id, email, hospital_id, expires_at, is_used 
            FROM admin_invites 
            WHERE token = %s
            """,
            (token,)
        )
        row = cur.fetchone()
        
    if not row:
        return None
        
    if row["is_used"] or row["expires_at"] < datetime.utcnow():
        return None
        
    return row

def mark_invite_used(token: str):
    with db_cursor() as cur:
        cur.execute("UPDATE admin_invites SET is_used = TRUE WHERE token = %s", (token,))
