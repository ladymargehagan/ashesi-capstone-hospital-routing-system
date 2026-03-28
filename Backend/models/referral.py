from typing import Optional
from core.db import db_cursor


def fetch_referrals(
    physician_id: Optional[int] = None,
    hospital_id: Optional[int] = None,
    assigned_physician_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    status: Optional[str] = None,
):
    with db_cursor() as cur:
        # We perform a massive JOIN here to grab patient info, hospital names,
        # and clinical details all at once. This avoids the N+1 query problem 
        # when displaying large tables on the frontend.
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
        if patient_id:
            query += " AND r.patient_id = %s"
            params.append(patient_id)
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
                   u.full_name AS physician_name,
                   au.full_name AS assigned_physician_name
            FROM referrals r
            JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
            JOIN hospitals recvh ON r.receiving_hospital_id = recvh.hospital_id
            JOIN physicians ph ON r.referring_physician_id = ph.physician_id
            JOIN users u ON ph.user_id = u.user_id
            LEFT JOIN physicians aph ON r.assigned_physician_id = aph.physician_id
            LEFT JOIN users au ON aph.user_id = au.user_id
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
    receiving_hospital_id: int, severity: str, stability: str, referral_reason: str,
    estimated_arrival_minutes: Optional[int], routing_queue_json: str,
    urgency_level: Optional[str] = None, known_allergies: Optional[str] = None,
    pre_existing_conditions: Optional[str] = None,
    incident_lat: Optional[float] = None, incident_lon: Optional[float] = None,
    routing_metadata: Optional[str] = None
) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO referrals
                (patient_id, referring_physician_id, referring_hospital_id,
                 receiving_hospital_id, severity, stability, referral_reason,
                 estimated_arrival_minutes, routing_queue, incident_lat, incident_lon,
                 routing_metadata, urgency_level, known_allergies, pre_existing_conditions)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING referral_id
            """,
            (patient_id, referring_physician_id, referring_hospital_id,
             receiving_hospital_id, severity, stability,
             referral_reason, estimated_arrival_minutes, routing_queue_json,
             incident_lat, incident_lon, routing_metadata,
             urgency_level, known_allergies, pre_existing_conditions),
        )
        return cur.fetchone()["referral_id"]


def insert_referral_details(
    referral_id: int, presenting_complaint: str, clinical_history: Optional[str],
    initial_diagnosis: Optional[str], current_condition: Optional[str], clinical_summary: Optional[str],
    examination_findings: Optional[str], working_diagnosis: Optional[str], reason_for_referral: Optional[str],
    investigations_done: Optional[str], treatment_given: Optional[str], additional_notes: Optional[str],
    required_specialist: Optional[str], required_facility: Optional[str],
    vital_signs: Optional[str] = None
):
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO referral_details
                (referral_id, presenting_complaint, clinical_history,
                 initial_diagnosis, current_condition, clinical_summary,
                 examination_findings, working_diagnosis, reason_for_referral,
                 investigations_done, treatment_given, additional_notes,
                 required_specialist, required_facility, vital_signs)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (referral_id, presenting_complaint, clinical_history,
             initial_diagnosis, current_condition, clinical_summary,
             examination_findings, working_diagnosis, reason_for_referral,
             investigations_done, treatment_given, additional_notes,
             required_specialist, required_facility, vital_signs),
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


def insert_transit_update(referral_id: int, update_text: str, logged_by: int) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO TRANSIT_UPDATES
                (referral_id, update_text, logged_by)
            VALUES (%s, %s, %s)
            RETURNING update_id
            """,
            (referral_id, update_text, logged_by),
        )
        return cur.fetchone()["update_id"]


def fetch_transit_updates(referral_id: int):
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT tu.*, u.full_name as logger_name, u.role_id 
            FROM TRANSIT_UPDATES tu
            JOIN USERS u ON tu.logged_by = u.user_id
            WHERE tu.referral_id = %s 
            ORDER BY tu.logged_at ASC
            """,
            (referral_id,),
        )
        return cur.fetchall()
