"""
Seed script for HRSdb.

Creates roles, a super admin user, and sample hospitals with resources
so the system can be tested end-to-end.

Usage:
    DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/HRSdb" python seed.py
"""

from __future__ import annotations

import os
import sys

# Ensure we can import from the Backend directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import db_cursor
from routes_auth import hash_password


def seed():
    print("🌱 Seeding HRSdb ...")

    with db_cursor() as cur:
        # 1. Roles (idempotent)
        print("  → Roles ...")
        for role_name, desc in [
            ("super_admin", "System administrator"),
            ("hospital_admin", "Hospital administrator"),
            ("physician", "Referring physician"),
        ]:
            cur.execute(
                "INSERT INTO role (role_name, description) VALUES (%s, %s) ON CONFLICT (role_name) DO NOTHING",
                (role_name, desc),
            )

        # 2. Super admin user
        print("  → Super admin user ...")
        cur.execute("SELECT role_id FROM role WHERE role_name = 'super_admin'")
        admin_role_id = cur.fetchone()["role_id"]

        admin_email = "admin@hrs.com"
        admin_pw = hash_password("admin123")
        cur.execute("SELECT user_id FROM users WHERE email = %s", (admin_email,))
        if not cur.fetchone():
            cur.execute(
                """
                INSERT INTO users (email, password_hash, role_id, full_name, status)
                VALUES (%s, %s, %s, %s, 'active')
                """,
                (admin_email, admin_pw, admin_role_id, "System Administrator"),
            )
            print(f"    Created: {admin_email} / admin123")
        else:
            print(f"    Already exists: {admin_email}")

        # 3. Sample hospitals (match the engine's mock data for testing)
        print("  → Sample hospitals ...")
        hospitals = [
            {
                "name": "Korle Bu Teaching Hospital",
                "license": "HLC-KBTH-001",
                "lat": 5.5600, "lon": -0.2057,
                "address": "Guggisberg Ave, Accra",
                "tier": "tier_3", "type": "teaching", "ownership": "public",
                "hours": "24/7", "phone": "0302-123-456",
            },
            {
                "name": "37 Military Hospital",
                "license": "HLC-37MH-002",
                "lat": 5.5830, "lon": -0.1850,
                "address": "Liberation Road, Accra",
                "tier": "tier_3", "type": "specialist", "ownership": "military",
                "hours": "24/7", "phone": "0302-654-321",
            },
            {
                "name": "Ridge Regional Hospital",
                "license": "HLC-RIDGE-003",
                "lat": 5.5605, "lon": -0.1860,
                "address": "Castle Road, Accra",
                "tier": "tier_2", "type": "regional", "ownership": "public",
                "hours": "7:00 - 22:00", "phone": "0302-111-222",
            },
            {
                "name": "LEKMA Hospital",
                "license": "HLC-LEKMA-004",
                "lat": 5.6030, "lon": -0.1300,
                "address": "Teshie-Nungua, Accra",
                "tier": "tier_2", "type": "district", "ownership": "public",
                "hours": "24/7", "phone": "0302-333-444",
            },
            {
                "name": "Tema General Hospital",
                "license": "HLC-TEMA-005",
                "lat": 5.6690, "lon": -0.0166,
                "address": "Tema Community 1, Tema",
                "tier": "tier_2", "type": "regional", "ownership": "public",
                "hours": "24/7", "phone": "0303-555-666",
            },
        ]

        # Resources per hospital (subset — enough to test the engine)
        hospital_resources = {
            "Korle Bu Teaching Hospital": [
                ("icu_beds", 10, 2), ("general_beds", 100, 45),
                ("theatre", 5, 3), ("blood_bank", 1, 1),
                ("ventilators", 8, 4), ("ct_scan", 2, 1),
            ],
            "37 Military Hospital": [
                ("icu_beds", 8, 1), ("general_beds", 80, 30),
                ("theatre", 4, 2), ("blood_bank", 1, 1),
                ("ventilators", 6, 3),
            ],
            "Ridge Regional Hospital": [
                ("icu_beds", 5, 0), ("general_beds", 60, 20),
                ("ventilators", 4, 3), ("ct_scan", 1, 1),
            ],
            "LEKMA Hospital": [
                ("icu_beds", 3, 1), ("general_beds", 40, 15),
                ("ventilators", 2, 2),
            ],
            "Tema General Hospital": [
                ("icu_beds", 4, 1), ("general_beds", 50, 25),
                ("ct_scan", 1, 1),
            ],
        }

        # Specialists per hospital
        hospital_specialists = {
            "Korle Bu Teaching Hospital": [
                ("Cardiology", "Dr. Kwame Asante", True),
                ("Trauma Surgery", "Dr. Ama Mensah", True),
                ("Neurology", "Dr. Kofi Boateng", False),
                ("Obstetrics", "Dr. Abena Osei", True),
                ("Pulmonology", "Dr. Yaw Darko", True),
            ],
            "37 Military Hospital": [
                ("Cardiology", "Dr. Samuel Tetteh", True),
                ("Trauma Surgery", "Dr. Grace Addo", True),
            ],
            "Ridge Regional Hospital": [
                ("Cardiology", "Dr. Emmanuel Adom", True),
                ("Pulmonology", "Dr. Mercy Adjei", True),
            ],
            "LEKMA Hospital": [
                ("Pulmonology", "Dr. Isaac Owusu", False),
            ],
            "Tema General Hospital": [
                ("Cardiology", "Dr. Peter Ankrah", True),
            ],
        }

        # Get hospital_admin role_id for admin users
        cur.execute("SELECT role_id FROM role WHERE role_name = 'hospital_admin'")
        ha_role_id = cur.fetchone()["role_id"]

        # Get physician role_id for physician users
        cur.execute("SELECT role_id FROM role WHERE role_name = 'physician'")
        phys_role_id = cur.fetchone()["role_id"]

        for h in hospitals:
            cur.execute("SELECT hospital_id FROM hospitals WHERE license_number = %s", (h["license"],))
            existing = cur.fetchone()
            if existing:
                print(f"    Already exists: {h['name']}")
                hospital_id = existing["hospital_id"]
            else:
                gps_point = f"({h['lat']},{h['lon']})"
                cur.execute(
                    """
                    INSERT INTO hospitals (name, license_number, gps_coordinates, address, tier, type, ownership, operating_hours, contact_phone, status)
                    VALUES (%s, %s, %s::point, %s, %s, %s, %s, %s, %s, 'active')
                    RETURNING hospital_id
                    """,
                    (h["name"], h["license"], gps_point, h["address"],
                     h["tier"], h["type"], h["ownership"], h["hours"], h["phone"]),
                )
                hospital_id = cur.fetchone()["hospital_id"]
                print(f"    Created: {h['name']} (id={hospital_id})")

            # Create a hospital admin user for each hospital
            admin_email_h = f"admin@{h['license'].lower().replace('-', '')}.com"
            cur.execute("SELECT user_id FROM users WHERE email = %s", (admin_email_h,))
            if not cur.fetchone():
                pw_hash = hash_password("hospital123")
                cur.execute(
                    """
                    INSERT INTO users (email, password_hash, role_id, full_name, hospital_id, status)
                    VALUES (%s, %s, %s, %s, %s, 'active')
                    """,
                    (admin_email_h, pw_hash, ha_role_id, f"Admin - {h['name']}", hospital_id),
                )
                print(f"    Created admin: {admin_email_h} / hospital123")

            # Insert resources (idempotent by checking existing)
            resources = hospital_resources.get(h["name"], [])
            for res_type, total, available in resources:
                cur.execute(
                    "SELECT resource_id FROM hospital_resources WHERE hospital_id = %s AND resource_type = %s",
                    (hospital_id, res_type),
                )
                if not cur.fetchone():
                    cur.execute(
                        """
                        INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (hospital_id, res_type, total, available, available > 0),
                    )

            # Insert specialists
            specialists = hospital_specialists.get(h["name"], [])
            for specialty, name, on_call in specialists:
                cur.execute(
                    "SELECT specialist_id FROM specialists WHERE hospital_id = %s AND specialty = %s AND specialist_name = %s",
                    (hospital_id, specialty, name),
                )
                if not cur.fetchone():
                    cur.execute(
                        """
                        INSERT INTO specialists (hospital_id, specialty, specialist_name, on_call_available)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (hospital_id, specialty, name, on_call),
                    )

        # 4. Create a sample physician user
        print("  → Sample physician ...")
        # Physician is at Korle Bu (first hospital)
        cur.execute("SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'")
        kbth_row = cur.fetchone()
        if kbth_row:
            kbth_id = kbth_row["hospital_id"]
            phys_email = "dr.brown@hrs.com"
            cur.execute("SELECT user_id FROM users WHERE email = %s", (phys_email,))
            if not cur.fetchone():
                pw_hash = hash_password("doctor123")
                cur.execute(
                    """
                    INSERT INTO users (email, password_hash, role_id, full_name, phone_number, hospital_id, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'active')
                    RETURNING user_id
                    """,
                    (phys_email, pw_hash, phys_role_id, "Dr. Michael Brown", "+233 24 123 4567", kbth_id),
                )
                user_id = cur.fetchone()["user_id"]

                # Also insert into physicians table
                cur.execute(
                    """
                    INSERT INTO physicians (user_id, hospital_id, license_number, specialization, status)
                    VALUES (%s, %s, %s, %s, 'active')
                    """,
                    (user_id, kbth_id, "MD-12345", "General Practice"),
                )
                print(f"    Created: {phys_email} / doctor123")
            else:
                print(f"    Already exists: {phys_email}")

    print("\n✅ Seeding complete!")
    print("\n📋 Login credentials:")
    print("   Super Admin:      admin@hrs.com / admin123")
    print("   Hospital Admin:   admin@hlckbth001.com / hospital123")
    print("   Physician:        dr.brown@hrs.com / doctor123")


if __name__ == "__main__":
    seed()
