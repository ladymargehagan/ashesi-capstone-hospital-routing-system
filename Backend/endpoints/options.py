from fastapi import APIRouter
from core.db import db_cursor

router = APIRouter(prefix="/api/options", tags=["options"])

@router.get("/specializations")
def get_specializations():
    with db_cursor() as cur:
        cur.execute("SELECT name FROM medical_specializations ORDER BY name")
        rows = cur.fetchall()
    return [row["name"] for row in rows]
