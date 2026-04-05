from core.db import db_cursor

statements = [
    "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS assigned_physician_id INTEGER REFERENCES PHYSICIANS(physician_id)",
    "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP",
    "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS routing_queue TEXT",
    "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS cascade_count INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS routing_metadata TEXT",
    "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS incident_lat DOUBLE PRECISION",
    "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS incident_lon DOUBLE PRECISION",
    "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS outcome VARCHAR(50)",
    "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS outcome_notes TEXT",
    "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS outcome_recorded_at TIMESTAMP",
]

with db_cursor() as cur:
    for stmt in statements:
        try:
            cur.execute(stmt)
            col = stmt.split("IF NOT EXISTS ")[1].split(" ")[0]
            print(f"  OK: {col}")
        except Exception as e:
            print(f"  SKIP: {e}")

print("\nMigration done.")
