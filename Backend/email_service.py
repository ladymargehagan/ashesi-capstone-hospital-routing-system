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

from db import db_cursor

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
        print(f"[EMAIL] Skipped (not configured): {subject} → {to_email}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())

        print(f"[EMAIL] Sent: {subject} → {to_email}")
        return True

    except Exception as e:
        print(f"[EMAIL] Failed: {subject} → {to_email}: {e}")
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
):
    """Notify the referring physician when referral status changes."""
    status_labels = {
        "approved": "✅ Accepted",
        "rejected": "❌ Rejected",
        "completed": "🏁 Completed",
        "cancelled": "🚫 Cancelled",
    }
    status_label = status_labels.get(new_status, new_status.title())

    notify_user(
        user_id=referring_physician_user_id,
        message=f"Referral #{referral_id} for {patient_name} has been {new_status}.",
        notification_type=f"referral_{new_status}",
        email_subject=f"[HRS] Referral Update — {patient_name} ({status_label})",
        email_body=_base_email(
            f"Referral {status_label}",
            f"""
            <p>Your referral has been updated.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; color: #64748b;">Referral ID</td><td style="padding: 8px; font-weight: 600;">#{referral_id}</td></tr>
                <tr><td style="padding: 8px; color: #64748b;">Patient</td><td style="padding: 8px; font-weight: 600;">{patient_name}</td></tr>
                <tr><td style="padding: 8px; color: #64748b;">New Status</td><td style="padding: 8px; font-weight: 600;">{status_label}</td></tr>
            </table>
            """,
        ),
    )


def notify_account_approved(user_id: int, full_name: str):
    """Notify a doctor that their account has been approved."""
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
                <a href="http://localhost:3000" 
                   style="background: #1e40af; color: white; padding: 12px 24px; 
                          border-radius: 8px; text-decoration: none; display: inline-block;">
                    Log In to HRS
                </a>
            </p>
            """,
        ),
    )
