from typing import Optional
from core.db import db_cursor


def fetch_referrals(
    physician_id: Optional[int] = None,
    hospital_id: Optional[int] = None,
    assigned_physician_id: Optional[int] = None,
    status: Optional[str] = None,
):
    with db_cursor() as cur:
        query = """
            SELECT r.*,
                   rh.name AS referring_hospital_name,
                   recvh.name AS receiving_hospital_name,
                   u.full_name AS physician_name,
                   p.full_name AS patient_name,
                   p.date_of_birth, p.sex, p.nhis_number, p.contact_number,
                   au.full_name AS assigned_physician_name,
                   rd.presenting_complaint, rd.clinical_history,
                   rd.initial_diagnosis, rd.current_condition,
                   rd.examination_findings, rd.working_diagnosis,
                   rd.reason_for_referral, rd.investigations_done,
                   rd.treatment_given, rd.additional_notes
            FROM referrals r
            JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
            JOIN hospitals recvh ON r.receiving_hospital_id = recvh.hospital_id
            JOIN physicians ph ON r.referring_physician_id = ph.physician_id
            JOIN users u ON ph.user_id = u.user_id
            JOIN patients p ON r.patient_id = p.patient_id
            LEFT JOIN referral_details rd ON r.referral_id = rd.referral_id
            LEFT JOIN physicians aph ON r.assigned_physician_id = aph.physician_id
            LEFT JOIN users au ON aph.user_id = au.user_id
            WHERE 1=1
        """
        params = []
        if physician_id:
            query += " AND (r.referring_physician_id = %s OR r.assigned_physician_id = %s)"
            params.extend([physician_id, physician_id])
        if hospital_id:
            query += " AND (r.referring_hospital_id = %s OR r.receiving_hospital_id = %s)"
            params.extend([hospital_id, hospital_id])
        if assigned_physician_id:
            query += " AND r.assigned_physician_id = %s"
            params.append(assigned_physician_id)
        if status:
            query += " AND r.status = %s"
            params.append(status)

        query += " ORDER BY r.submitted_at DESC"
        cur.execute(query, params)
        return cur.fetchall()


def fetch_referral_metadata(referral_id: int):
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT r.*,
                   rh.name AS referring_hospital_name,
                   recvh.name AS receiving_hospital_name,
                   u.full_name AS physician_name
            FROM referrals r
            JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
            JOIN hospitals recvh ON r.receiving_hospital_id = recvh.hospital_id
            JOIN physicians ph ON r.referring_physician_id = ph.physician_id
            JOIN users u ON ph.user_id = u.user_id
            WHERE r.referral_id = %s
            """,
            (referral_id,),
        )
        return cur.fetchone()


def fetch_referral_details_db(referral_id: int):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM referral_details WHERE referral_id = %s", (referral_id,))
        return cur.fetchone()


def insert_referral(
    patient_id: int, referring_physician_id: int, referring_hospital_id: int,
    receiving_hospital_id: int, severity: str, stability: str, emergency_type: str,
    estimated_arrival_minutes: Optional[int], routing_queue_json: str
) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO referrals
                (patient_id, referring_physician_id, referring_hospital_id,
                 receiving_hospital_id, severity, stability, emergency_type,
                 estimated_arrival_minutes, routing_queue)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING referral_id
            """,
            (patient_id, referring_physician_id, referring_hospital_id,
             receiving_hospital_id, severity, stability,
             emergency_type, estimated_arrival_minutes, routing_queue_json),
        )
        return cur.fetchone()["referral_id"]


def insert_referral_details(
    referral_id: int, presenting_complaint: str, clinical_history: Optional[str],
    initial_diagnosis: Optional[str], current_condition: Optional[str], clinical_summary: Optional[str],
    examination_findings: Optional[str], working_diagnosis: Optional[str], reason_for_referral: Optional[str],
    investigations_done: Optional[str], treatment_given: Optional[str], additional_notes: Optional[str],
    required_specialist: Optional[str], required_facility: Optional[str]
):
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO referral_details
                (referral_id, presenting_complaint, clinical_history,
                 initial_diagnosis, current_condition, clinical_summary,
                 examination_findings, working_diagnosis, reason_for_referral,
                 investigations_done, treatment_given, additional_notes,
                 required_specialist, required_facility)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (referral_id, presenting_complaint, clinical_history,
             initial_diagnosis, current_condition, clinical_summary,
             examination_findings, working_diagnosis, reason_for_referral,
             investigations_done, treatment_given, additional_notes,
             required_specialist, required_facility),
        )


def check_referral_exists(referral_id: int) -> bool:
    with db_cursor() as cur:
        cur.execute("SELECT 1 FROM referrals WHERE referral_id = %s", (referral_id,))
        return cur.fetchone() is not None


def update_referral_status_in_db(
    referral_id: int, updates: list, params: list
) -> bool:
    with db_cursor() as cur:
        cur.execute(
            f"UPDATE referrals SET {', '.join(updates)} WHERE referral_id = %s RETURNING referral_id",
            params,
        )
        return cur.fetchone() is not None


def fetch_referral_status_info(referral_id: int):
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT r.patient_id, p.full_name as patient_name,
                   ph.user_id as physician_user_id
            FROM referrals r
            JOIN patients p ON r.patient_id = p.patient_id
            JOIN physicians ph ON r.referring_physician_id = ph.physician_id
            WHERE r.referral_id = %s
            """,
            (referral_id,),
        )
        return cur.fetchone()


def assign_referral_to_physician(referral_id: int, physician_id: int):
    with db_cursor() as cur:
        cur.execute(
            "UPDATE referrals SET assigned_physician_id = %s WHERE referral_id = %s",
            (physician_id, referral_id),
        )


def check_physician_exists_and_active(physician_id: int) -> bool:
    with db_cursor() as cur:
        cur.execute(
            "SELECT 1 FROM physicians WHERE physician_id = %s AND status = 'active'",
            (physician_id,),
        )
        return cur.fetchone() is not None


def insert_attachment(
    referral_id: int, file_name: str, file_path: str, file_type: str, file_size_bytes: int, uploaded_by: int
) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO referral_attachments
                (referral_id, file_name, file_path, file_type, file_size_bytes, uploaded_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING attachment_id
            """,
            (referral_id, file_name, file_path, file_type, file_size_bytes, uploaded_by),
        )
        return cur.fetchone()["attachment_id"]


def fetch_attachments(referral_id: int):
    with db_cursor() as cur:
        cur.execute(
            "SELECT * FROM referral_attachments WHERE referral_id = %s ORDER BY uploaded_at",
            (referral_id,),
        )
        return cur.fetchall()


def fetch_attachment_by_id(attachment_id: int):
    with db_cursor() as cur:
        cur.execute(
            "SELECT file_name, file_path, file_type FROM referral_attachments WHERE attachment_id = %s",
            (attachment_id,),
        )
        return cur.fetchone()
