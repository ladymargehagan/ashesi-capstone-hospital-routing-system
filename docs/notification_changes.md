# Notification System — Change Log & Technical Detail

This document outlines the implementation of the comprehensive notification system in the Hospital Routing System (HRS) capstone project.

## 1. Why it was done

The HRS required a robust way to keep physicians, hospital admins, and super admins informed about critical events (referrals, account approvals, and system alerts). The previous implementation had non-functional UI stubs and no backend logic for delivering these messages.

## 2. Shared Architecture

The system uses a **two-layer** approach:

1. **Persistent DB Notifications**: Stored in the `NOTIFICATIONS` table. These appear in the "Bell" popover in the header and persist across sessions.
2. **Ephemeral Toast Alerts**: In-app pop-ups (bottom-right) for immediate feedback during an active session (e.g., "Referral Submitted!").

---

## 3. Backend Changes

### New Module: `routes_notifications.py`

We added a dedicated API for managing the notification lifecycle:

- `GET /api/notifications`: Returns the latest 50 notifications for the logged-in user.
- `GET /api/notifications/unread-count`: Lightweight endpoint for the frontend to poll for new alerts.
- `PUT /api/notifications/{id}/read`: Marks a specific notification as viewed.
- `PUT /api/notifications/read-all`: Bulk action to clear the unread badge.

### Trigger Integration

We wired the notification triggers into the existing business logic:

- **Referrals (`routes_referrals.py`)**:
  - When a referral is created, the receiving hospital admin is notified via `notify_referral_created`.
  - When a status changes (Approved/Rejected/Completed), the referring physician is notified via `notify_referral_status_changed`.
- **User Management (`routes_users.py`)**:
  - When a physician's account is activated by an admin, they receive `notify_account_approved`.

### Email Service (`email_service.py`)

This existing service was fully utilized to send styled HTML emails via Gmail SMTP. We added `python-multipart` to `requirements.txt` to support the file attachment features required by the updated `routes_referrals.py`.

---

## 4. Frontend Changes

### Components & UI

- **`NotificationInboxPopover`**: A modern, Radix-based popover replacing the old sidebar. It categorizes notifications into "All" and "Unread" tabs and uses color-coded icons (via Lucide) for different event types.
- **`ToastProvider`**: A custom React Context-based toast system. It allows any component to trigger alerts using a simple hook: `useToast().success("Message")`.
- **`useNotifications` Hook**: Handles the coordination between the API and the UI, including a 30-second polling interval to keep the unread badge up to date.

### Integration

- **`header.tsx`**: Integrated the new Bell popover and removed the legacy sidebar state.
- **`layout.tsx`**: Wrapped the entire application in the `ToastProvider` to ensure alerts can be shown from anywhere in the app.
- **`api-client.ts`**: Extended to support the new notification endpoints.

---

#### 5. Database Schema Updates

To support the latest backend features merged from the origin, the following columns were added to the local PostgreSQL database:

- `users`: `auth_provider`, `profile_picture_url`, `google_id`.
- `physicians`: `title`, `department`, `grade`.
- `notifications`: `email_sent`.
- `hospitals`: Renamed logic from `tier` to `level` in frontend types to match PRD.

---

## 6. Verification

The system was verified using `curl` for backend API correctness and `npx tsc` to ensure zero TypeScript errors in the new frontend components.
