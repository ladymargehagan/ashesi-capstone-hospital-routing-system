"""
One-time migration: clean up the production database schema.

1. Split patients.full_name into first_name + last_name
2. Drop unused columns (google_id, auth_provider, hospitals.type, physicians.hospital_id)
3. Drop unused password_resets table

Run from Backend/:
    python run_schema_cleanup.py
"""
from core.db import db_cursor

print("=== Step 1: Patient name split ===")
patient_stmts = [
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)",
    """
    UPDATE patients
    SET first_name = SPLIT_PART(full_name, ' ', 1),
        last_name  = CASE
            WHEN POSITION(' ' IN full_name) > 0
            THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
            ELSE ''
        END
    WHERE first_name IS NULL
    """,
    "ALTER TABLE patients ALTER COLUMN first_name SET NOT NULL",
    "ALTER TABLE patients ALTER COLUMN last_name SET NOT NULL",
]

with db_cursor() as cur:
    for stmt in patient_stmts:
        try:
            cur.execute(stmt)
            print(f"  OK: {stmt.strip()[:70]}...")
        except Exception as e:
            print(f"  SKIP: {e}")

print("\n=== Step 2: Drop unused columns ===")
drop_stmts = [
    "ALTER TABLE users DROP COLUMN IF EXISTS google_id",
    "ALTER TABLE users DROP COLUMN IF EXISTS auth_provider",
    "ALTER TABLE hospitals DROP COLUMN IF EXISTS type",
    "ALTER TABLE physicians DROP COLUMN IF EXISTS hospital_id",
]

with db_cursor() as cur:
    for stmt in drop_stmts:
        try:
            cur.execute(stmt)
            print(f"  OK: {stmt}")
        except Exception as e:
            print(f"  SKIP: {e}")

print("\n=== Step 3: Drop unused tables ===")
with db_cursor() as cur:
    try:
        cur.execute("DROP TABLE IF EXISTS password_resets")
        print("  OK: Dropped password_resets table")
    except Exception as e:
        print(f"  SKIP: {e}")

print("\nSchema cleanup done.")
