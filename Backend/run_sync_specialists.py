"""
One-time migration: populate the specialists table from existing
approved physicians who have a specialization.

This bridges the gap where physicians registered with specializations
but nothing was added to the specialists table (used by the routing algorithm).

Run from Backend/:
    python run_sync_specialists.py
"""
from core.db import db_cursor

print("=== Syncing physician specializations → specialists table ===\n")

with db_cursor() as cur:
    # Find all active physicians with a specialization
    cur.execute("""
        SELECT p.specialization, u.hospital_id, u.full_name
        FROM physicians p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.status = 'active'
          AND p.specialization IS NOT NULL
          AND p.specialization != ''
          AND u.hospital_id IS NOT NULL
    """)
    physicians = cur.fetchall()

print(f"Found {len(physicians)} active physicians with specializations.\n")

created = 0
skipped = 0

for phys in physicians:
    specialty = phys["specialization"]
    hospital_id = phys["hospital_id"]
    name = phys["full_name"]

    with db_cursor() as cur:
        # Check if this specialty already exists at this hospital
        cur.execute(
            "SELECT specialist_id FROM specialists WHERE hospital_id = %s AND specialty = %s",
            (hospital_id, specialty),
        )
        if cur.fetchone():
            print(f"  SKIP: {specialty} already exists at hospital {hospital_id}")
            skipped += 1
            continue

        cur.execute(
            """
            INSERT INTO specialists (hospital_id, specialty, specialist_name, on_call_available)
            VALUES (%s, %s, %s, %s)
            """,
            (hospital_id, specialty, name, False),
        )
        print(f"  ADDED: {specialty} ({name}) → hospital {hospital_id}")
        created += 1

print(f"\nDone. Created {created} specialist entries, skipped {skipped} duplicates.")
