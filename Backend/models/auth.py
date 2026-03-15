from typing import Optional
from core.db import db_cursor


def fetch_user_for_login(email: str):
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT u.user_id, u.email, u.password_hash, u.full_name, u.phone_number,
                   u.hospital_id, u.status, u.auth_provider, u.profile_picture_url,
                   r.role_name, u.created_at,
                   h.name AS hospital_name, h.address AS hospital_address,
                   h.contact_phone,
                   p.title, p.license_number, p.specialization, p.department, p.grade
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            LEFT JOIN hospitals h ON u.hospital_id = h.hospital_id
            LEFT JOIN physicians p ON u.user_id = p.user_id
            WHERE u.email = %s
            """,
            (email,),
        )
        return cur.fetchone()


def check_email_exists(email: str) -> bool:
    with db_cursor() as cur:
        cur.execute("SELECT 1 FROM users WHERE email = %s", (email,))
        return cur.fetchone() is not None


def check_license_exists(license_number: str) -> bool:
    with db_cursor() as cur:
        cur.execute("SELECT 1 FROM physicians WHERE license_number = %s", (license_number,))
        return cur.fetchone() is not None


def fetch_role_id_by_name(role_name: str) -> Optional[int]:
    with db_cursor() as cur:
        cur.execute("SELECT role_id FROM role WHERE role_name = %s", (role_name,))
        row = cur.fetchone()
        return row["role_id"] if row else None


def insert_pending_user(email: str, password_hash: str, role_id: int, full_name: str, phone_number: Optional[str], hospital_id: int) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (email, password_hash, role_id, full_name,
                               phone_number, hospital_id, auth_provider, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'local', 'pending')
            RETURNING user_id
            """,
            (email, password_hash, role_id, full_name, phone_number, hospital_id),
        )
        return cur.fetchone()["user_id"]


def insert_pending_physician(user_id: int, hospital_id: int, license_number: str, title: Optional[str], specialization: Optional[str], department: Optional[str], grade: Optional[str]) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO physicians (user_id, hospital_id, license_number,
                                    title, specialization, department, grade, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING physician_id
            """,
            (user_id, hospital_id, license_number, title, specialization, department, grade),
        )
        return cur.fetchone()["physician_id"]


def fetch_user_by_google_id(google_id: str):
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT u.*, r.role_name
            FROM users u JOIN role r ON u.role_id = r.role_id
            WHERE u.google_id = %s
            """,
            (google_id,),
        )
        return cur.fetchone()


def fetch_user_by_email_google(email: str):
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT u.*, r.role_name
            FROM users u JOIN role r ON u.role_id = r.role_id
            WHERE u.email = %s
            """,
            (email,),
        )
        return cur.fetchone()


def link_google_account(user_id: int, google_id: str, profile_picture_url: Optional[str]):
    with db_cursor() as cur:
        cur.execute(
            """
            UPDATE users SET google_id = %s, auth_provider = 'google',
                   profile_picture_url = COALESCE(profile_picture_url, %s),
                   updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
            """,
            (google_id, profile_picture_url, user_id),
        )


def insert_google_user(email: str, role_id: int, full_name: str, phone_number: Optional[str], hospital_id: Optional[int], google_id: str, profile_picture_url: Optional[str]) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (email, password_hash, role_id, full_name,
                               phone_number, hospital_id, google_id,
                               auth_provider, profile_picture_url, status)
            VALUES (%s, NULL, %s, %s, %s, %s, %s, 'google', %s, 'pending')
            RETURNING user_id
            """,
            (email, role_id, full_name, phone_number, hospital_id, google_id, profile_picture_url),
        )
        return cur.fetchone()["user_id"]


def fetch_user_by_id_complete(user_id: int):
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT u.user_id, u.email, u.full_name, u.phone_number,
                   u.hospital_id, u.status, u.auth_provider,
                   u.profile_picture_url, r.role_name, u.created_at,
                   h.name AS hospital_name, h.address AS hospital_address,
                   h.contact_phone,
                   p.title, p.license_number, p.specialization, p.department, p.grade
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            LEFT JOIN hospitals h ON u.hospital_id = h.hospital_id
            LEFT JOIN physicians p ON u.user_id = p.user_id
            WHERE u.user_id = %s
            """,
            (user_id,),
        )
        return cur.fetchone()


def check_admin_exists_dev(email: str):
    with db_cursor() as cur:
        cur.execute("SELECT user_id FROM users WHERE email = %s", (email,))
        return cur.fetchone()


def update_admin_password_dev(email: str, password_hash: str):
    with db_cursor() as cur:
        cur.execute(
            "UPDATE users SET password_hash = %s WHERE email = %s",
            (password_hash, email),
        )


def insert_active_dev_user(email: str, password_hash: str, role_id: int, name: str, hospital_id: Optional[int] = None) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (email, password_hash, role_id, full_name,
                               hospital_id, auth_provider, status)
            VALUES (%s, %s, %s, %s, %s, 'local', 'active')
            RETURNING user_id
            """,
            (email, password_hash, role_id, name, hospital_id),
        )
        return cur.fetchone()["user_id"]


def fetch_physician_id_by_user(user_id: int) -> Optional[str]:
    with db_cursor() as cur:
        cur.execute(
            "SELECT physician_id FROM physicians WHERE user_id = %s",
            (user_id,),
        )
        row = cur.fetchone()
        return str(row["physician_id"]) if row else None
