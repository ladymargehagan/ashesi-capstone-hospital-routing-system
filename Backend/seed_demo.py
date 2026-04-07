"""
Demo seed script for HRS.

1. Creates a cardiologist account at 37 Military Hospital.
2. Refreshes resource figures for 4 demo hospitals:
   - 37 Military Hospital
   - University of Ghana Medical Centre (UGMC)
   - Regional Health Directorate (new site)
   - Ridge Hospital

Usage:
    cd Backend && python seed_demo.py
"""

from __future__ import annotations

import os
import sys
from datetime import datetime

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from core.db import db_cursor

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://rhoxppyvbdonwhnrwmbs.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJob3hwcHl2YmRvbndobnJ3bWJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcwMTAwNSwiZXhwIjoyMDkwMjc3MDA1fQ.QS-Ek-DcfGED6hJ6cxu-NTblFkYV9kI8B-N2yawo_sk",
)

# ---------------------------------------------------------------------------
# Demo cardiologist credentials
# ---------------------------------------------------------------------------
DEMO_CARDIOLOGIST = {
    "first_name": "Kwame",
    "last_name": "Asante",
    "full_name": "Kwame Asante",
    "email": "kwame.asante.cardio@hrs.med.gh",
    "password": "Cardio@37Mil#2026",
    "specialization": "Cardiology",
    "license_number": "MDC-37001",
    "title": "Dr",
    "phone": "0244567890",
    "hospital_name": "37 Military Hospital",
}

# ---------------------------------------------------------------------------
# Demo resource figures (realistic, slightly busy for demo interest)
# ---------------------------------------------------------------------------
DEMO_RESOURCES = {
    "37 Military Hospital": [
        ("general_beds",   700, 412),
        ("emergency_beds",  50,  28),
        ("icu_beds",        25,  11),
        ("stroke_beds",     10,   5),
        ("pediatric_beds",  60,  38),
        ("maternity_beds",  80,  47),
        ("oxygen_beds",     35,  21),
        ("monitored_beds",  30,  17),
        ("adjustable_beds", 40,  25),
        ("theatre",          8,   4),
        ("blood_bank",       1,   1),
        ("lab",              1,   1),
        ("xray",             4,   3),
        ("ct_scan",          2,   2),
        ("mri",              1,   1),
        ("ultrasound",       5,   4),
        ("dialysis",         6,   3),
        ("ventilators",     18,  10),
        ("oxygen",           1,   1),
    ],
    "University of Ghana Medical Centre": [
        ("general_beds",   500, 310),
        ("emergency_beds",  60,  35),
        ("icu_beds",        30,  14),
        ("stroke_beds",     15,   7),
        ("pediatric_beds",  80,  50),
        ("maternity_beds", 100,  62),
        ("oxygen_beds",     40,  24),
        ("monitored_beds",  35,  20),
        ("adjustable_beds", 50,  32),
        ("theatre",         10,   6),
        ("blood_bank",       1,   1),
        ("lab",              1,   1),
        ("xray",             3,   3),
        ("ct_scan",          2,   2),
        ("mri",              1,   1),
        ("ultrasound",       4,   4),
        ("dialysis",         8,   5),
        ("ventilators",     20,  12),
        ("oxygen",           1,   1),
    ],
    "Regional Health Directorate (new site)": [
        ("general_beds",  200, 130),
        ("emergency_beds",  30,  18),
        ("icu_beds",        12,   6),
        ("stroke_beds",      6,   3),
        ("pediatric_beds",  40,  26),
        ("maternity_beds",  50,  31),
        ("oxygen_beds",     20,  12),
        ("monitored_beds",  15,   9),
        ("adjustable_beds", 20,  13),
        ("theatre",          5,   3),
        ("blood_bank",       1,   1),
        ("lab",              1,   1),
        ("xray",             2,   2),
        ("ct_scan",          1,   1),
        ("ultrasound",       3,   3),
        ("ventilators",     10,   6),
        ("oxygen",           1,   1),
    ],
    "Ridge Hospital": [
        ("general_beds",  420, 268),
        ("emergency_beds",  35,  20),
        ("icu_beds",        15,   8),
        ("stroke_beds",      8,   4),
        ("pediatric_beds",  50,  33),
        ("maternity_beds",  60,  39),
        ("oxygen_beds",     25,  15),
        ("monitored_beds",  20,  12),
        ("adjustable_beds", 25,  16),
        ("theatre",          6,   3),
        ("blood_bank",       1,   1),
        ("lab",              1,   1),
        ("xray",             3,   2),
        ("ct_scan",          1,   1),
        ("ultrasound",       4,   3),
        ("ventilators",     12,   7),
        ("oxygen",           1,   1),
    ],
}


def create_supabase_user(email: str, password: str) -> str | None:
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
        },
        json={"email": email, "password": password, "email_confirm": True},
        timeout=15,
    )
    if resp.status_code in (200, 201):
        return resp.json()["id"]

    # If the email already exists in Supabase, look up the existing UID
    if resp.status_code == 422 and "email_exists" in resp.text:
        print(f"  Supabase account already exists for {email}, fetching existing UID...")
        list_resp = requests.get(
            f"{SUPABASE_URL}/auth/v1/admin/users?email={email}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            },
            timeout=15,
        )
        if list_resp.status_code == 200:
            users = list_resp.json().get("users", [])
            if users:
                return users[0]["id"]

    print(f"  WARNING: Supabase user creation failed: {resp.status_code} {resp.text[:200]}")
    return None


def seed():
    print("=" * 60)
    print("  HRS Demo Seed Script")
    print("=" * 60)

    with db_cursor() as cur:
        # ----------------------------------------------------------------
        # Step 1: Create cardiologist at 37 Military Hospital
        # ----------------------------------------------------------------
        print(f"\n--- Step 1: Creating cardiologist at {DEMO_CARDIOLOGIST['hospital_name']} ---")

        cur.execute(
            "SELECT hospital_id FROM hospitals WHERE name = %s",
            (DEMO_CARDIOLOGIST["hospital_name"],),
        )
        row = cur.fetchone()
        if not row:
            print(f"  ERROR: '{DEMO_CARDIOLOGIST['hospital_name']}' not found in hospitals table.")
            sys.exit(1)
        hospital_id = row["hospital_id"]
        print(f"  Hospital ID: {hospital_id}")

        # Check if account already exists
        cur.execute("SELECT user_id FROM users WHERE email = %s", (DEMO_CARDIOLOGIST["email"],))
        existing = cur.fetchone()
        if existing:
            print(f"  Account already exists (user_id={existing['user_id']}), skipping creation.")
        else:
            cur.execute("SELECT role_id FROM role WHERE role_name = 'physician'")
            physician_role_id = cur.fetchone()["role_id"]

            auth_uid = create_supabase_user(DEMO_CARDIOLOGIST["email"], DEMO_CARDIOLOGIST["password"])
            if not auth_uid:
                print("  ERROR: Could not create Supabase auth account. Aborting.")
                sys.exit(1)

            cur.execute(
                """
                INSERT INTO users (email, role_id, first_name, last_name, phone_number, hospital_id, status, auth_uid)
                VALUES (%s, %s, %s, %s, %s, %s, 'active', %s)
                RETURNING user_id
                """,
                (
                    DEMO_CARDIOLOGIST["email"],
                    physician_role_id,
                    DEMO_CARDIOLOGIST["first_name"],
                    DEMO_CARDIOLOGIST["last_name"],
                    DEMO_CARDIOLOGIST["phone"],
                    hospital_id,
                    auth_uid,
                ),
            )
            user_id = cur.fetchone()["user_id"]

            cur.execute(
                """
                INSERT INTO physicians (user_id, license_number, title, specialization, status)
                VALUES (%s, %s, %s, %s, 'active')
                RETURNING physician_id
                """,
                (
                    user_id,
                    DEMO_CARDIOLOGIST["license_number"],
                    DEMO_CARDIOLOGIST["title"],
                    DEMO_CARDIOLOGIST["specialization"],
                ),
            )
            physician_id = cur.fetchone()["physician_id"]
            print(f"  Created: user_id={user_id}, physician_id={physician_id}")
            print(f"  Email:    {DEMO_CARDIOLOGIST['email']}")
            print(f"  Password: {DEMO_CARDIOLOGIST['password']}")

        # ----------------------------------------------------------------
        # Step 2: Refresh demo hospital resources
        # ----------------------------------------------------------------
        print("\n--- Step 2: Updating demo hospital resources ---")

        for hospital_name, resources in DEMO_RESOURCES.items():
            cur.execute("SELECT hospital_id FROM hospitals WHERE name = %s", (hospital_name,))
            h_row = cur.fetchone()
            if not h_row:
                print(f"  WARNING: '{hospital_name}' not found, skipping.")
                continue
            hid = h_row["hospital_id"]

            # Delete existing resource rows for this hospital
            cur.execute("DELETE FROM hospital_resources WHERE hospital_id = %s", (hid,))

            now = datetime.utcnow()
            for res_type, total, available in resources:
                cur.execute(
                    """
                    INSERT INTO hospital_resources
                        (hospital_id, resource_type, total_count, available_count, is_available, last_updated)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (hid, res_type, total, available, available > 0, now),
                )
            print(f"  Updated {len(resources)} resources for '{hospital_name}' (id={hid})")

    print("\n" + "=" * 60)
    print("  Demo Seed Complete!")
    print("=" * 60)
    print(f"\n  Cardiologist account at 37 Military Hospital:")
    print(f"    Email:    {DEMO_CARDIOLOGIST['email']}")
    print(f"    Password: {DEMO_CARDIOLOGIST['password']}")
    print(f"    Name:     Dr {DEMO_CARDIOLOGIST['full_name']}")
    print(f"    Spec:     {DEMO_CARDIOLOGIST['specialization']}")
    print("=" * 60)


if __name__ == "__main__":
    seed()
