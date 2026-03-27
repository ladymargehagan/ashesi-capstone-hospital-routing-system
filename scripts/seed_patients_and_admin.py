import sys, os
from datetime import datetime
import bcrypt

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Backend')))
from core.db import get_conn

def run():
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        # 1. Create Admin User for 37 Military Hospital
        password = b'admin123'
        hashed = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')
        
        cur.execute("SELECT user_id FROM users WHERE email = %s", ("admin37@military.gh",))
        admin_user = cur.fetchone()
        
        if not admin_user:
            # role_id 2 is hospital_admin, hospital_id 1 is 37 Military Hospital
            cur.execute('''
                INSERT INTO users (full_name, email, password_hash, role_id, hospital_id, phone_number, status, auth_provider, created_at, updated_at) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING user_id
            ''', ('37 Military Admin', 'admin37@military.gh', hashed, 2, 1, '0501234567', 'active', 'local', datetime.now(), datetime.now()))
            print("Created Admin for 37 Military Hospital:", cur.fetchone()[0])
        else:
            print("Admin for 37 Military Hospital already exists:", admin_user[0])
            
        # 2. Get physicians and insert patients
        cur.execute('SELECT u.user_id, u.hospital_id, u.full_name, p.physician_id FROM users u JOIN physicians p ON u.user_id = p.user_id')
        physicians = cur.fetchall()
        
        patient_surnames = ["Osei", "Appiah", "Boakye", "Mensah", "Owusu", "Amoah", "Gyan", "Kusi", "Danquah", "Asare", "Agyemang", "Ofori"]
        first_names = ["Kwabena", "Akosua", "Kofi", "Ama", "Kwame", "Abena", "Yaw", "Yaa", "Kofi", "Afia", "Kwame", "Ama"]

        count = 0
        for i, phys in enumerate(physicians):
            user_id, hosp_id, name, phys_id = phys
            
            cur.execute("SELECT patient_id FROM patients WHERE physician_id = %s", (phys_id,))
            existing_patients = cur.fetchall()
            
            patients_to_create = max(0, 3 - len(existing_patients))
            
            for j in range(patients_to_create):
                idx = (i * 3 + j) % len(first_names)
                p_name = f"{first_names[idx]} {patient_surnames[idx]}"
                patient_identifier = f"PID-{phys_id}-{int(datetime.now().timestamp())}-{j}"
                
                cur.execute('''
                    INSERT INTO patients (
                        full_name, patient_identifier, sex, date_of_birth,
                        contact_number, address, next_of_kin_name, next_of_kin_contact,
                        nhis_number, nhis_status, registered_at, hospital_id, physician_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING patient_id
                ''', (
                    p_name, patient_identifier, 'male' if idx % 2 == 0 else 'female', '1990-01-01',
                    f"024000{str(idx).zfill(4)}", f"House {idx}, Accra", f"Next Kin {p_name}", f"054000{str(idx).zfill(4)}",
                    f"NHIS-{str(idx).zfill(6)}", 'Active', datetime.now(), hosp_id, phys_id
                ))
                count += 1
                
        print(f"Successfully ensured 3 patients for each of {len(physicians)} physicians (Added {count} new records).")
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error occurred: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    run()
