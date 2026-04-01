"""
Email notification service for HRS.

Sends email notifications for key referral lifecycle events.
Supports Gmail SMTP out of the box. Configure via environment variables:

    SMTP_HOST     = smtp.gmail.com
    SMTP_PORT     = 587
    SMTP_USER     = your.email@gmail.com
    SMTP_PASSWORD = your-app-password
    SMTP_FROM     = HRS Notifications <your.email@gmail.com>

For Gmail, use an App Password (not your regular password):
  1. Enable 2FA on your Google account
  2. Go to https://myaccount.google.com/apppasswords
  3. Generate a password for "Mail"
"""

from __future__ import annotations

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from core.db import db_cursor

# SMTP config from environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

# Feature flag: disable email if SMTP not configured
EMAIL_ENABLED = bool(SMTP_USER and SMTP_PASSWORD)


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an HTML email. Returns True on success, False on failure.
    Silently fails if email is not configured (logs a warning).
    """
    if not EMAIL_ENABLED:
        print(f"[EMAIL] Skipped (not configured): SMTP_USER={'set' if SMTP_USER else 'empty'}, SMTP_PASSWORD={'set' if SMTP_PASSWORD else 'empty'}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        print(f"[EMAIL] Connecting to {SMTP_HOST}:{SMTP_PORT} as {SMTP_USER}...")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())

        print(f"[EMAIL] Sent: {subject} → {to_email}")
        return True

    except Exception as e:
        print(f"[EMAIL] Failed: {subject} → {to_email}: {type(e).__name__}: {e}")
        return False


# ---------------------------------------------------------------------------
# Notification helpers: create in-app notification + send email
# ---------------------------------------------------------------------------

def notify_user(
    user_id: int,
    message: str,
    notification_type: str,
    email_subject: Optional[str] = None,
    email_body: Optional[str] = None,
):
    """
    Create an in-app notification and optionally send an email.
    If email_subject and email_body are provided, attempts to send email.
    """
    email_sent = False

    # Get user email for notification
    user_email = None
    if email_subject and email_body:
        with db_cursor() as cur:
            cur.execute("SELECT email FROM users WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            if row:
                user_email = row["email"]

        if user_email:
            email_sent = send_email(user_email, email_subject, email_body)

    # Create in-app notification
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO notifications (user_id, message, type, email_sent)
            VALUES (%s, %s, %s, %s)
            """,
            (user_id, message, notification_type, email_sent),
        )


# ---------------------------------------------------------------------------
# Pre-built notification templates
# ---------------------------------------------------------------------------

def _base_email(title: str, content: str) -> str:
    """Wrap content in a styled HTML email template."""
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">🏥 HRS Notification</h1>
            <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">{title}</p>
        </div>
        <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            {content}
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
            Hospital Routing System — Greater Accra Region
        </p>
    </div>
    """


def notify_referral_created(referral_id: int, patient_name: str, receiving_hospital_id: int):
    """Notify receiving hospital admin(s) about a new incoming referral."""
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT u.user_id FROM users u
            JOIN role r ON u.role_id = r.role_id
            WHERE u.hospital_id = %s AND r.role_name = 'hospital_admin' AND u.status = 'active'
            """,
            (receiving_hospital_id,),
        )
        admins = cur.fetchall()

    for admin in admins:
        notify_user(
            user_id=admin["user_id"],
            message=f"New incoming referral (#{referral_id}) for patient {patient_name}.",
            notification_type="referral_created",
            email_subject=f"[HRS] New Incoming Referral — {patient_name}",
            email_body=_base_email(
                "New Incoming Referral",
                f"""
                <p>A new patient referral has been submitted to your facility.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; color: #64748b;">Referral ID</td><td style="padding: 8px; font-weight: 600;">#{referral_id}</td></tr>
                    <tr><td style="padding: 8px; color: #64748b;">Patient</td><td style="padding: 8px; font-weight: 600;">{patient_name}</td></tr>
                </table>
                <p>Please log in to review and respond to this referral.</p>
                """,
            ),
        )


def notify_referral_status_changed(
    referral_id: int,
    patient_name: str,
    new_status: str,
    referring_physician_user_id: int,
    reason: str = None,
):
    """Notify the referring physician when referral status changes."""
    status_labels = {
        "approved": "✅ Accepted",
        "rejected": "❌ Rejected",
        "arrived": "🏥 Patient Arrived",
        "completed": "🏁 Completed",
        "cancelled": "🚫 Cancelled",
        "in_transit": "🚑 Patient Dispatched (In Transit)",
        "no_capacity": "⚠️ Hospital Full (No Capacity)",
    }
    status_label = status_labels.get(new_status, new_status.title())

    message_details = ""
    if reason:
        # Provide extra context depending on if it was completed or rejected
        title_suffix = "Outcome" if new_status == "completed" else "Reason"
        message_details = f"<tr><td style='padding: 8px; color: #64748b; vertical-align: top;'>{title_suffix}</td><td style='padding: 8px; font-weight: 600; white-space: pre-wrap;'>{reason}</td></tr>"

    notify_user(
        user_id=referring_physician_user_id,
        message=f"Referral #{referral_id} for {patient_name} has been {new_status}. {f'Details: {reason[:100]}...' if reason else ''}",
        notification_type=f"referral_{new_status}",
        email_subject=f"[HRS] Referral Update — {patient_name} ({status_label})",
        email_body=_base_email(
            f"Referral {status_label}",
            f"""
            <p>Your referral has been updated.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; color: #64748b; width: 30%;">Referral ID</td><td style="padding: 8px; font-weight: 600;">#{referral_id}</td></tr>
                <tr><td style="padding: 8px; color: #64748b;">Patient</td><td style="padding: 8px; font-weight: 600;">{patient_name}</td></tr>
                <tr><td style="padding: 8px; color: #64748b;">New Status</td><td style="padding: 8px; font-weight: 600;">{status_label}</td></tr>
                {message_details}
            </table>
            """,
        ),
    )


def notify_patient_dispatched_and_updates(
    referral_id: int,
    patient_name: str,
    event_type: str,
    update_text: str = ""
):
    """
    Notify all involved parties (referring doc, receiving doc, both admins)
    about a patient dispatch or a live transit update.
    event_type can be 'patient_dispatched' or 'transit_update'
    """
    with db_cursor() as cur:
        # Get users associated with the referral
        cur.execute(
            """
            SELECT p1.user_id as ref_doc_user_id,
                   p2.user_id as rec_doc_user_id,
                   r.referring_hospital_id,
                   r.receiving_hospital_id
            FROM REFERRALS r
            JOIN PHYSICIANS p1 ON r.referring_physician_id = p1.physician_id
            LEFT JOIN PHYSICIANS p2 ON r.assigned_physician_id = p2.physician_id
            WHERE r.referral_id = %s
            """,
            (referral_id,),
        )
        ref_data = cur.fetchone()
        if not ref_data:
            return
            
        cur.execute(
            """
            SELECT user_id 
            FROM USERS u JOIN ROLE rl ON u.role_id = rl.role_id
            WHERE rl.role_name = 'hospital_admin' 
              AND u.hospital_id IN (%s, %s)
            """,
            (ref_data["referring_hospital_id"], ref_data["receiving_hospital_id"])
        )
        admin_users = cur.fetchall()

    target_user_ids = set()
    target_user_ids.add(ref_data["ref_doc_user_id"])
    if ref_data["rec_doc_user_id"]:
        target_user_ids.add(ref_data["rec_doc_user_id"])
    for a in admin_users:
        target_user_ids.add(a["user_id"])

    if event_type == "patient_dispatched":
        subject = f"[HRS] Patient Dispatched — {patient_name}"
        title = "Patient Dispatched (In Transit)"
        message = f"Patient {patient_name} (Referral #{referral_id}) has been dispatched and is en route."
        body_content = f"<p>The referring facility has dispatched {patient_name}. They are currently in transit.</p>"
    else:
        subject = f"[HRS] Live Transit Update — {patient_name}"
        title = "Live Condition Update"
        message = f"New transit update for {patient_name} (Referral #{referral_id}): {update_text[:50]}..."
        body_content = f"<p>A new condition update was posted during transit:</p><blockquote style='border-left: 4px solid #3b82f6; padding-left: 10px; color: #475569;'>{update_text}</blockquote>"

    # Email for both dispatched and transit updates so all parties stay informed
    should_email = True

    for uid in target_user_ids:
        notify_user(
            user_id=uid,
            message=message,
            notification_type=event_type,
            email_subject=subject if should_email else None,
            email_body=_base_email(
                title,
                f"""
                {body_content}
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; color: #64748b;">Referral ID</td><td style="padding: 8px; font-weight: 600;">#{referral_id}</td></tr>
                    <tr><td style="padding: 8px; color: #64748b;">Patient</td><td style="padding: 8px; font-weight: 600;">{patient_name}</td></tr>
                </table>
                """
            ) if should_email else None,
        )


def notify_referral_assigned(
    referral_id: int,
    patient_name: str,
    assigned_physician_user_id: int,
    referring_physician_user_id: int,
    assigned_physician_name: str = "",
):
    """Notify both the assigned physician and the referring physician when a doctor is assigned to a referral."""
    # Notify the assigned physician
    notify_user(
        user_id=assigned_physician_user_id,
        message=f"You have been assigned to Referral #{referral_id} for patient {patient_name}. Please review the patient's file.",
        notification_type="referral_assigned",
        email_subject=f"[HRS] You've Been Assigned to a Referral — {patient_name}",
        email_body=_base_email(
            "Referral Assignment",
            f"""
            <p>You have been assigned as the receiving physician for a patient referral.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; color: #64748b;">Referral ID</td><td style="padding: 8px; font-weight: 600;">#{referral_id}</td></tr>
                <tr><td style="padding: 8px; color: #64748b;">Patient</td><td style="padding: 8px; font-weight: 600;">{patient_name}</td></tr>
            </table>
            <p>Please log in to review the patient's file and prepare for their arrival.</p>
            """,
        ),
    )

    # Notify the referring physician
    assigned_label = f"Dr. {assigned_physician_name}" if assigned_physician_name else "a physician"
    notify_user(
        user_id=referring_physician_user_id,
        message=f"Referral #{referral_id} for {patient_name} has been assigned to {assigned_label} at the receiving hospital.",
        notification_type="referral_assigned_update",
        email_subject=f"[HRS] Doctor Assigned to Your Referral — {patient_name}",
        email_body=_base_email(
            "Doctor Assigned to Your Referral",
            f"""
            <p>A physician has been assigned to your referral at the receiving hospital.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; color: #64748b;">Referral ID</td><td style="padding: 8px; font-weight: 600;">#{referral_id}</td></tr>
                <tr><td style="padding: 8px; color: #64748b;">Patient</td><td style="padding: 8px; font-weight: 600;">{patient_name}</td></tr>
                <tr><td style="padding: 8px; color: #64748b;">Assigned Doctor</td><td style="padding: 8px; font-weight: 600;">{assigned_label}</td></tr>
            </table>
            """,
        ),
    )


def notify_account_approved(user_id: int, full_name: str):
    """Notify a doctor that their account has been approved."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    notify_user(
        user_id=user_id,
        message=f"Your account has been approved! You can now create referrals.",
        notification_type="account_approved",
        email_subject="[HRS] Account Approved — Welcome!",
        email_body=_base_email(
            "Account Approved",
            f"""
            <p>Dear {full_name},</p>
            <p>Your HRS account has been <strong style="color: #16a34a;">approved</strong>.
            You can now log in and start creating patient referrals.</p>
            <p style="margin-top: 20px;">
                <a href="{frontend_url}"
                   style="background: #1e40af; color: white; padding: 12px 24px;
                          border-radius: 8px; text-decoration: none; display: inline-block;">
                    Log In to HRS
                </a>
            </p>
            """,
        ),
    )


def notify_account_rejected(user_id: int, full_name: str):
    """Notify a doctor that their account has been rejected."""
    notify_user(
        user_id=user_id,
        message="Your account registration has been rejected. Please contact an administrator for details.",
        notification_type="account_rejected",
        email_subject="[HRS] Account Registration Update",
        email_body=_base_email(
            "Account Registration Update",
            f"""
            <p>Dear {full_name},</p>
            <p>We regret to inform you that your HRS account registration has not been approved at this time.</p>
            <p>If you believe this is in error, please contact your hospital administrator for more information.</p>
            """,
        ),
    )


def notify_data_flagged(hospital_id: int, category: str, notes: str, flagger_user_id: int):
    """Notify all receiving hospital admins when a referring physician flags their data as inconsistent."""
    with db_cursor() as cur:
        cur.execute("SELECT name FROM hospitals WHERE hospital_id = %s", (hospital_id,))
        h_row = cur.fetchone()
        hospital_name = h_row["name"] if h_row else "Your Hospital"
        
        cur.execute(
            """
            SELECT u.user_id FROM users u
            JOIN role r ON u.role_id = r.role_id
            WHERE u.hospital_id = %s AND r.role_name = 'hospital_admin' AND u.status = 'active'
            """,
            (hospital_id,),
        )
        admins = cur.fetchall()

    for admin in admins:
        notify_user(
            user_id=admin["user_id"],
            message=f"A physician has flagged inconsistent data for {hospital_name}: {category}",
            notification_type="data_flagged",
            email_subject=f"[HRS] Inconsistent Data Flagged — {hospital_name}",
            email_body=_base_email(
                "Inconsistent Data Flagged",
                f"""
                <p>A referring physician has reported inconsistent data matching your hospital's profile during a referral transfer.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; color: #64748b;">Category</td><td style="padding: 8px; font-weight: 600;">{category}</td></tr>
                    <tr><td style="padding: 8px; color: #64748b; vertical-align: top;">Notes</td><td style="padding: 8px; font-weight: 600; white-space: pre-wrap;">{notes or 'None provided'}</td></tr>
                </table>
                <p>Please log in to your dashboard to review and resolve this flag.</p>
                """,
            ),
        )


def notify_profile_updated(user_id: int, full_name: str):
    """Notify a user that their profile information has been changed."""
    notify_user(
        user_id=user_id,
        message="Your HRS profile information has been successfully updated.",
        notification_type="profile_updated",
        email_subject="[HRS] Profile Information Updated",
        email_body=_base_email(
            "Profile Updated",
            f"""
            <p>Dear {full_name},</p>
            <p>Your Hospital Routing System profile information was recently updated.</p>
            <p>If you did not authorize these changes, please contact your super administrator immediately.</p>
            """,
        ),
    )
