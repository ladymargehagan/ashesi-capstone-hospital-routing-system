from core.db import db_cursor

with db_cursor() as cur:
    cur.execute("ALTER TABLE PHYSICIANS ADD COLUMN IF NOT EXISTS availability BOOLEAN NOT NULL DEFAULT FALSE;")

print("Migration done: availability column added to PHYSICIANS.")
