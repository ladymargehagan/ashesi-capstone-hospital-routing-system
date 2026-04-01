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


def insert_pending_user(email: str, password_hash: Optional[str], role_id: int, first_name: str, last_name: str, phone_number: Optional[str], hospital_id: int, auth_uid: Optional[str] = None) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (email, password_hash, role_id, first_name, last_name,
                               phone_number, hospital_id, auth_provider, status, auth_uid)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'local', 'pending', %s)
            RETURNING user_id
            """,
            (email, password_hash, role_id, first_name, last_name, phone_number, hospital_id, auth_uid),
        )
        return cur.fetchone()["user_id"]


def insert_pending_physician(user_id: int, license_number: str, title: Optional[str], specialization: Optional[str], department: Optional[str], grade: Optional[str]) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO physicians (user_id, license_number,
                                    title, specialization, department, grade, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending')
            RETURNING physician_id
            """,
            (user_id, license_number, title, specialization, department, grade),
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


def insert_google_user(email: str, role_id: int, first_name: str, last_name: str, phone_number: Optional[str], hospital_id: Optional[int], google_id: str, profile_picture_url: Optional[str]) -> int:
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (email, password_hash, role_id, first_name, last_name,
                               phone_number, hospital_id, google_id,
                               auth_provider, profile_picture_url, status)
            VALUES (%s, NULL, %s, %s, %s, %s, %s, %s, 'google', %s, 'pending')
            RETURNING user_id
            """,
            (email, role_id, first_name, last_name, phone_number, hospital_id, google_id, profile_picture_url),
        )
        return cur.fetchone()["user_id"]


def fetch_user_by_auth_uid(auth_uid: str):
    """Look up a user by their Supabase auth UUID."""
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT u.user_id, u.email, u.full_name, u.phone_number,
                   u.hospital_id, u.status, u.auth_provider,
                   u.profile_picture_url, r.role_name, u.created_at,
                   h.name AS hospital_name, h.address AS hospital_address,
                   h.contact_phone,
                   p.physician_id, p.title, p.license_number, p.specialization, p.department, p.grade
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            LEFT JOIN hospitals h ON u.hospital_id = h.hospital_id
            LEFT JOIN physicians p ON u.user_id = p.user_id
            WHERE u.auth_uid = %s
            """,
            (auth_uid,),
        )
        return cur.fetchone()


def link_auth_uid(user_id: int, auth_uid: str):
    """Link a Supabase auth UUID to an existing public.users row."""
    with db_cursor() as cur:
        cur.execute(
            "UPDATE users SET auth_uid = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s",
            (auth_uid, user_id),
        )


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


def fetch_physician_id_by_user(user_id: int) -> Optional[str]:
    with db_cursor() as cur:
        cur.execute(
            "SELECT physician_id FROM physicians WHERE user_id = %s",
            (user_id,),
        )
        row = cur.fetchone()
        return str(row["physician_id"]) if row else None


def update_rejected_user_to_pending(data: dict) -> dict:
    """Update a rejected user's status back to pending and overwrite their details."""
    with db_cursor() as cur:
        cur.execute(
            """
            UPDATE users SET
                status = 'pending',
                first_name = %s,
                last_name = %s,
                phone_number = %s,
                hospital_id = %s,
                auth_uid = COALESCE(auth_uid, %s),
                updated_at = CURRENT_TIMESTAMP
            WHERE email = %s
            RETURNING user_id
            """,
            (
                data["first_name"], data["last_name"], data.get("phone_number"),
                data["hospital_id"], data.get("auth_uid"), data["email"]
            )
        )
        row = cur.fetchone()
        if not row:
            raise Exception("User not found during update")
        user_id = row["user_id"]

        cur.execute("SELECT physician_id FROM physicians WHERE user_id = %s", (user_id,))
        phys_row = cur.fetchone()

        if phys_row:
            cur.execute(
                """
                UPDATE physicians SET
                    status = 'pending',
                    license_number = %s,
                    title = %s,
                    specialization = %s,
                    department = %s,
                    grade = %s
                WHERE user_id = %s
                RETURNING physician_id
                """,
                (
                    data["license_number"], data.get("title"), data.get("specialization"),
                    data.get("department"), data.get("grade"), user_id
                )
            )
            physician_id = cur.fetchone()["physician_id"]
        else:
            cur.execute(
                """
                INSERT INTO physicians (user_id, license_number, title, specialization, department, grade, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                RETURNING physician_id
                """,
                (
                    user_id, data["license_number"], data.get("title"),
                    data.get("specialization"), data.get("department"), data.get("grade")
                )
            )
            physician_id = cur.fetchone()["physician_id"]

        return {"user_id": user_id, "physician_id": physician_id}
