"""
Test suite for HRS API endpoints.

Auth strategy
-------------
`core.auth.get_current_user` calls `fetch_user_by_id_complete` from models.auth.
We patch it at the point of use — `core.auth.fetch_user_by_id_complete` — so the
auth dependency returns a controlled fake user with no live DB needed.
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from api import app

# Unauthenticated client (no cookies)
anon = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# Fake user stubs
# ---------------------------------------------------------------------------

FAKE_PHYSICIAN = {
    "user_id": 1, "email": "doc@hrs.gh", "full_name": "Dr. Test",
    "role_name": "physician", "hospital_id": 1, "status": "active",
}

FAKE_HOSPITAL_ADMIN = {
    "user_id": 2, "email": "admin@hrs.gh", "full_name": "Admin Test",
    "role_name": "hospital_admin", "hospital_id": 1, "status": "active",
}

FAKE_SUPER_ADMIN = {
    "user_id": 3, "email": "super@hrs.gh", "full_name": "Super Admin",
    "role_name": "super_admin", "hospital_id": None, "status": "active",
}

# The correct patch path: where fetch_user_by_id_complete is CALLED (not defined)
AUTH_PATCH = "core.auth.fetch_user_by_id_complete"


def authed_client(fake_user: dict) -> TestClient:
    """Return a TestClient pre-loaded with a session cookie for fake_user."""
    c = TestClient(app, raise_server_exceptions=False)
    c.cookies.set("hrs_user_id", str(fake_user["user_id"]))
    return c


# ---------------------------------------------------------------------------
# 1. Unauthenticated access — must always be 401
# ---------------------------------------------------------------------------

class TestUnauthenticated:
    def test_create_referral_no_cookie(self):
        response = anon.post("/api/referrals", json={})
        assert response.status_code == 401

    def test_update_resource_no_cookie(self):
        response = anon.put("/api/resources/1", json={"is_available": True})
        assert response.status_code == 401

    def test_get_resources_no_cookie(self):
        response = anon.get("/api/resources/1")
        assert response.status_code == 401

    def test_create_patient_no_cookie(self):
        response = anon.post("/api/patients", json={})
        assert response.status_code == 401

    def test_list_users_no_cookie(self):
        response = anon.get("/api/users")
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# 2. Public endpoints — no cookie needed
# ---------------------------------------------------------------------------

def test_get_hospitals_list():
    """GET /api/hospitals is public — always 200."""
    response = anon.get("/api/hospitals")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_health_check():
    """GET /api/health should always return 200."""
    response = anon.get("/api/health")
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# 3. Pydantic validation — requires auth, fails on bad payload
# ---------------------------------------------------------------------------

def test_create_referral_missing_patient_id():
    """Missing patient_id → 422 Pydantic validation error."""
    with patch(AUTH_PATCH, return_value=FAKE_PHYSICIAN):
        c = authed_client(FAKE_PHYSICIAN)
        response = c.post("/api/referrals", json={
            "referring_physician_id": 1,
            "referring_hospital_id": 1,
            "receiving_hospital_id": 2,
            "severity": "high",
            "stability": "stable",
            "presenting_complaint": "Chest pain",
        })
    assert response.status_code == 422


def test_create_patient_missing_full_name():
    """Missing full_name → 422 Pydantic validation error."""
    with patch(AUTH_PATCH, return_value=FAKE_PHYSICIAN):
        c = authed_client(FAKE_PHYSICIAN)
        response = c.post("/api/patients", json={
            "hospital_id": 1,
            "contact_number": "1234567890",
        })
    assert response.status_code == 422


def test_add_specialist_missing_hospital_id():
    """Missing hospital_id → 422 Pydantic validation error."""
    with patch(AUTH_PATCH, return_value=FAKE_HOSPITAL_ADMIN):
        c = authed_client(FAKE_HOSPITAL_ADMIN)
        response = c.post("/api/specialists", json={"specialty": "Cardiology"})
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# 4. Controller-level error responses (requires auth + live DB)
# ---------------------------------------------------------------------------

def test_update_resource_invalid_payload():
    """Updating a non-existent resource → 400 or 404."""
    with patch(AUTH_PATCH, return_value=FAKE_HOSPITAL_ADMIN):
        c = authed_client(FAKE_HOSPITAL_ADMIN)
        response = c.put("/api/resources/9999", json={"is_available": False})
    assert response.status_code in (400, 404)


def test_invalid_referral_status():
    """Invalid status value → 400 from controller."""
    with patch(AUTH_PATCH, return_value=FAKE_HOSPITAL_ADMIN):
        c = authed_client(FAKE_HOSPITAL_ADMIN)
        response = c.put("/api/referrals/1/status", json={"status": "invalid_status"})
    assert response.status_code == 400


def test_assign_invalid_physician():
    """Assigning a non-existent physician → 404."""
    with patch(AUTH_PATCH, return_value=FAKE_HOSPITAL_ADMIN):
        c = authed_client(FAKE_HOSPITAL_ADMIN)
        response = c.put("/api/referrals/1/assign", json={"physician_id": 9999})
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# 5. RBAC enforcement — wrong role gets 403
# ---------------------------------------------------------------------------

def test_physician_cannot_update_resource():
    """Physicians must get 403 on resource update (hospital_admin only)."""
    with patch(AUTH_PATCH, return_value=FAKE_PHYSICIAN):
        c = authed_client(FAKE_PHYSICIAN)
        response = c.put("/api/resources/1", json={"is_available": True})
    assert response.status_code == 403


def test_physician_cannot_approve_referral():
    """Physicians must get 403 on referral status update (hospital_admin only)."""
    with patch(AUTH_PATCH, return_value=FAKE_PHYSICIAN):
        c = authed_client(FAKE_PHYSICIAN)
        response = c.put("/api/referrals/1/status", json={"status": "approved"})
    assert response.status_code == 403


def test_physician_cannot_list_all_users():
    """Physicians must get 403 on GET /api/users (super_admin only)."""
    with patch(AUTH_PATCH, return_value=FAKE_PHYSICIAN):
        c = authed_client(FAKE_PHYSICIAN)
        response = c.get("/api/users")
    assert response.status_code == 403


def test_hospital_admin_cannot_list_all_users():
    """Hospital admins must also get 403 on GET /api/users (super_admin only)."""
    with patch(AUTH_PATCH, return_value=FAKE_HOSPITAL_ADMIN):
        c = authed_client(FAKE_HOSPITAL_ADMIN)
        response = c.get("/api/users")
    assert response.status_code == 403


def test_hospital_admin_cannot_create_patient():
    """Hospital admins get 403 on patient creation (physician only)."""
    with patch(AUTH_PATCH, return_value=FAKE_HOSPITAL_ADMIN):
        c = authed_client(FAKE_HOSPITAL_ADMIN)
        response = c.post("/api/patients", json={
            "physician_id": 1, "hospital_id": 1,
            "patient_identifier": "P001", "full_name": "Test Patient",
        })
    assert response.status_code == 403
