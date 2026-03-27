import os
import sys
import random

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Backend'))
from psycopg2.extras import RealDictCursor
from core.db import get_conn, release_conn

def seed_data():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT hospital_id FROM hospitals WHERE name ILIKE '%37 military%' LIMIT 1")
        row = cur.fetchone()
        if not row:
            print("Could not find 37 Military Hospital")
        else:
            hospital_id = row["hospital_id"]
            email = "admin@37military.org"
            
            cur.execute("SELECT role_id FROM role WHERE role_name = 'hospital_admin'")
            role_row = cur.fetchone()
            if not role_row:
                print("Could not find hospital_admin role")
                return
            role_id = role_row["role_id"]
            
            cur.execute("SELECT user_id FROM users WHERE email = %s", (email,))
            if not cur.fetchone():
                import bcrypt
                salt = bcrypt.gensalt()
                hashed = bcrypt.hashpw("Password123!".encode(), salt).decode()
                cur.execute(
                    """
                    INSERT INTO users (email, password_hash, role_id, full_name, hospital_id, status)
                    VALUES (%s, %s, %s, 'Admin 37 Military', %s, 'active')
                    """,
                    (email, hashed, role_id, hospital_id)
                )
                print(f"Created admin account {email} for 37 Military Hospital with password 'Password123!'")
        
        cur.execute("SELECT p.physician_id, u.hospital_id FROM physicians p JOIN users u ON p.user_id = u.user_id WHERE p.status = 'active'")
        physicians = cur.fetchall()
        
        first_names = ["Kwame", "Ama", "Kofi", "Abena", "Yaw", "Yaa", "Kwaku", "Akua"]
        last_names = ["Mensah", "Osei", "Owusu", "Boateng", "Appiah", "Arthur"]
        
        patients_created = 0
        referrals_created = 0
        
        for doctor in physicians:
            physician_id = doctor["physician_id"]
            hospital_id = doctor["hospital_id"]
            
            cur.execute(
                "SELECT COUNT(*) as count FROM referrals WHERE referring_physician_id = %s OR assigned_physician_id = %s",
                (physician_id, physician_id)
            )
            if cur.fetchone()["count"] >= 3:
                continue
                
            for i in range(3):
                name = f"{random.choice(first_names)} {random.choice(last_names)}"
                nhis = f"NHIS-{random.randint(100000, 999999)}"
                
                cur.execute(
                    """
                    INSERT INTO patients (patient_identifier, full_name, date_of_birth, sex, nhis_number, hospital_id, physician_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING patient_id
                    """,
                    (f"P-{random.randint(1000,9999)}", name, "1990-01-01", "male", nhis, hospital_id, physician_id)
                )
                patient_id = cur.fetchone()["patient_id"]
                patients_created += 1
                
                cur.execute("SELECT hospital_id FROM hospitals WHERE hospital_id != %s LIMIT 1", (hospital_id,))
                rec_row = cur.fetchone()
                receiving_hospital_id = rec_row["hospital_id"] if rec_row else hospital_id + 1
                
                cur.execute(
                    """
                    INSERT INTO referrals 
                    (patient_id, referring_physician_id, referring_hospital_id, receiving_hospital_id, status, severity, stability, referral_reason, urgency_level)
                    VALUES (%s, %s, %s, %s, 'pending', 'medium', 'stable', 'general', 'routine')
                    RETURNING referral_id
                    """,
                    (patient_id, physician_id, hospital_id, receiving_hospital_id)
                )
                ref_id = cur.fetchone()["referral_id"]
                
                cur.execute(
                    """
                    INSERT INTO referral_details (referral_id, presenting_complaint)
                    VALUES (%s, 'Routine checkup')
                    """,
                    (ref_id,)
                )
                referrals_created += 1
                
        conn.commit()
        print(f"Seeded {patients_created} patients and {referrals_created} referrals for {len(physicians)} physicians.")
    except Exception as e:
        conn.rollback()
        print("Error:", e)
    finally:
        cur.close()
        release_conn(conn)

if __name__ == '__main__':
    seed_data()
