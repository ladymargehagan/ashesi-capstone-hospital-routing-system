from typing import Optional

from core.db import db_cursor


def fetch_patients(physician_id: Optional[int] = None, hospital_id: Optional[int] = None, strict_rule: bool = False):
    with db_cursor() as cur:
        if strict_rule:
            if not physician_id:
                return []
            
            # Patients referred by this physician OR assigned to this physician
            cur.execute(
                """
                SELECT DISTINCT p.* FROM patients p
                LEFT JOIN referrals r ON p.patient_id = r.patient_id
                WHERE p.physician_id = %s OR r.referring_physician_id = %s OR r.assigned_physician_id = %s
                ORDER BY p.full_name
                """,
                (physician_id, physician_id, physician_id),
            )
        elif hospital_id:
            # Patients registered at this hospital (via physician) PLUS patients referred to it
            cur.execute(
                """
                SELECT DISTINCT p.* FROM patients p
                JOIN physicians ph ON p.physician_id = ph.physician_id
                JOIN users u ON ph.user_id = u.user_id
                WHERE u.hospital_id = %s
                UNION
                SELECT DISTINCT p.* FROM patients p
                JOIN referrals r ON p.patient_id = r.patient_id
                WHERE r.receiving_hospital_id = %s
                  AND r.status IN ('pending', 'approved', 'in_transit', 'completed')
                ORDER BY full_name
                """,
                (hospital_id, hospital_id),
            )
        elif physician_id:
            cur.execute(
                "SELECT * FROM patients WHERE physician_id = %s ORDER BY registered_at DESC",
                (physician_id,),
            )
        else:
            cur.execute("SELECT * FROM patients ORDER BY registered_at DESC")
        return cur.fetchall()


def fetch_patient_by_id(patient_id: int):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM patients WHERE patient_id = %s", (patient_id,))
        return cur.fetchone()


def insert_patient(
    physician_id: int,
    patient_identifier: str,
    full_name: str,
    date_of_birth: Optional[str] = None,
    sex: Optional[str] = None,
    nhis_number: Optional[str] = None,
    nhis_status: Optional[str] = None,
    contact_number: Optional[str] = None,
    address: Optional[str] = None,
    next_of_kin_name: Optional[str] = None,
    next_of_kin_contact: Optional[str] = None,
) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO patients
                (physician_id, patient_identifier, full_name,
                 date_of_birth, sex, nhis_number, nhis_status, contact_number,
                 address, next_of_kin_name, next_of_kin_contact)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING patient_id
            """,
            (physician_id, patient_identifier,
             full_name, date_of_birth, sex, nhis_number,
             nhis_status, contact_number, address,
             next_of_kin_name, next_of_kin_contact),
        )
        return cur.fetchone()["patient_id"]
