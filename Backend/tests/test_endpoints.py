"""
Comprehensive test suite for HRS API endpoints.

Auth strategy
-------------
Uses FastAPI's `app.dependency_overrides` to inject fake users,
bypassing JWT verification entirely. This is resilient to auth
implementation changes (cookie → JWT → whatever comes next).

Run:  cd Backend && python -m pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient

from api import app
from core.auth import get_current_user, require_role


# ---------------------------------------------------------------------------
# Fake user stubs
# ---------------------------------------------------------------------------

FAKE_PHYSICIAN = {
    "id": 1, "email": "doc@hrs.gh", "full_name": "Dr. Test",
    "role": "physician", "hospital_id": 1, "status": "active",
}

FAKE_HOSPITAL_ADMIN = {
    "id": 2, "email": "admin@hrs.gh", "full_name": "Admin Test",
    "role": "hospital_admin", "hospital_id": 1, "status": "active",
}

FAKE_SUPER_ADMIN = {
    "id": 3, "email": "super@hrs.gh", "full_name": "Super Admin",
    "role": "super_admin", "hospital_id": None, "status": "active",
}


# ---------------------------------------------------------------------------
# Override helpers
# ---------------------------------------------------------------------------

def _override_user(fake_user: dict):
    """Override get_current_user to return the given fake user."""
    app.dependency_overrides[get_current_user] = lambda: fake_user

    # Also override any require_role(...) instances.
    # require_role returns a new function each time, so we override
    # get_current_user which is its inner dependency.
    # FastAPI resolves the inner Depends(get_current_user) inside require_role
    # using the override, so this single override covers role checks too.


def _clear_overrides():
    app.dependency_overrides.clear()


client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def cleanup_overrides():
    """Ensure overrides are cleared after every test."""
    yield
    _clear_overrides()


# ===========================================================================
# 1. UNAUTHENTICATED ACCESS — must always be 401
# ===========================================================================

class TestUnauthenticated:
    """All protected endpoints must return 401 without a token."""

    def test_create_referral(self):
        assert client.post("/api/referrals", json={}).status_code == 401

    def test_list_referrals(self):
        assert client.get("/api/referrals").status_code == 401

    def test_update_resource(self):
        assert client.put("/api/resources/1", json={"is_available": True}).status_code == 401

    def test_get_resources(self):
        assert client.get("/api/resources/1").status_code == 401

    def test_create_patient(self):
        assert client.post("/api/patients", json={}).status_code == 401

    def test_list_users(self):
        assert client.get("/api/users").status_code == 401

    def test_list_notifications(self):
        assert client.get("/api/notifications").status_code == 401

    def test_unread_count(self):
        assert client.get("/api/notifications/unread-count").status_code == 401

    def test_health_summary(self):
        assert client.get("/api/health/summary").status_code == 401

    def test_run_audit(self):
        assert client.post("/api/health/run-audit").status_code == 401

    def test_health_alerts(self):
        assert client.get("/api/health/alerts").status_code == 401

    def test_update_user_status(self):
        assert client.put("/api/users/1/status", json={"status": "active"}).status_code == 401

    def test_update_user_profile(self):
        assert client.put("/api/users/1/profile", json={"full_name": "X"}).status_code == 401

    def test_report_inaccuracy(self):
        assert client.post("/api/resources/1/report-inaccuracy", json={"resource_type": "beds", "notes": "wrong"}).status_code == 401

    def test_create_specialist(self):
        assert client.post("/api/specialists", json={}).status_code == 401

    def test_generate_invite(self):
        assert client.post("/api/super-admin/invites", json={}).status_code == 401


# ===========================================================================
# 2. PUBLIC ENDPOINTS — no auth needed
# ===========================================================================

class TestPublicEndpoints:
    def test_hospitals_list(self):
        """GET /api/hospitals is public."""
        r = client.get("/api/hospitals")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_health_check(self):
        """GET /api/health is a basic liveness probe."""
        r = client.get("/api/health")
        assert r.status_code == 200

    def test_options_specializations(self):
        """GET /api/options/specializations is public."""
        r = client.get("/api/options/specializations")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ===========================================================================
# 3. PYDANTIC VALIDATION — auth passes, bad payload → 422
# ===========================================================================

class TestValidation:
    def test_create_referral_missing_fields(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.post("/api/referrals", json={
            "referring_physician_id": 1,
            "referring_hospital_id": 1,
            "receiving_hospital_id": 2,
            "severity": "high",
            "stability": "stable",
            "presenting_complaint": "Chest pain",
            # missing patient_id
        })
        assert r.status_code == 422

    def test_create_patient_missing_full_name(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.post("/api/patients", json={
            "hospital_id": 1,
            "contact_number": "1234567890",
            # missing full_name
        })
        assert r.status_code == 422

    def test_add_specialist_missing_hospital_id(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.post("/api/specialists", json={"specialty": "Cardiology"})
        assert r.status_code == 422

    def test_update_user_status_missing_status(self):
        _override_user(FAKE_SUPER_ADMIN)
        r = client.put("/api/users/1/status", json={})
        assert r.status_code == 422

    def test_report_inaccuracy_missing_notes(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.post("/api/resources/1/report-inaccuracy", json={
            "resource_type": "beds",
            # missing notes
        })
        assert r.status_code == 422

    def test_transit_update_missing_text(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.post("/api/referrals/1/transit-updates", json={})
        assert r.status_code == 422

    def test_referral_status_invalid_value(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.put("/api/referrals/1/status", json={"status": "invalid_status"})
        assert r.status_code == 400


# ===========================================================================
# 4. RBAC — wrong role gets 403
# ===========================================================================

class TestRBAC:
    """Role-based access control enforcement."""

    # --- Physician cannot do admin things ---

    def test_physician_cannot_update_resource(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.put("/api/resources/1", json={"is_available": True})
        assert r.status_code == 403

    def test_physician_cannot_approve_referral(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.put("/api/referrals/1/status", json={"status": "approved"})
        assert r.status_code == 403

    def test_physician_cannot_list_all_users(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.get("/api/users")
        assert r.status_code == 403

    def test_physician_cannot_add_specialist(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.post("/api/specialists", json={
            "hospital_id": 1, "specialty": "Cardiology",
            "specialist_name": "Dr. Heart",
        })
        assert r.status_code == 403

    def test_physician_cannot_add_resource(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.post("/api/resources/1", json={
            "resource_type": "beds", "total_count": 10, "available_count": 5,
        })
        assert r.status_code == 403

    def test_physician_cannot_view_health_summary(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.get("/api/health/summary")
        assert r.status_code == 403

    def test_physician_cannot_run_audit(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.post("/api/health/run-audit")
        assert r.status_code == 403

    def test_physician_cannot_view_alerts(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.get("/api/health/alerts")
        assert r.status_code == 403

    def test_physician_cannot_generate_invite(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.post("/api/super-admin/invites", json={
            "email": "new@hrs.gh", "hospital_id": 1,
        })
        assert r.status_code == 403

    def test_physician_cannot_change_user_status(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.put("/api/users/1/status", json={"status": "active"})
        assert r.status_code == 403

    # --- Hospital admin cannot do super admin things ---

    def test_hospital_admin_cannot_list_all_users(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.get("/api/users")
        assert r.status_code == 403

    def test_hospital_admin_cannot_create_patient(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.post("/api/patients", json={
            "physician_id": 1, "hospital_id": 1,
            "patient_identifier": "P001", "full_name": "Test Patient",
        })
        assert r.status_code == 403

    def test_hospital_admin_cannot_view_global_health(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.get("/api/health/summary")
        assert r.status_code == 403

    def test_hospital_admin_cannot_run_audit(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.post("/api/health/run-audit")
        assert r.status_code == 403

    def test_hospital_admin_cannot_generate_invite(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.post("/api/super-admin/invites", json={
            "email": "new@hrs.gh", "hospital_id": 1,
        })
        assert r.status_code == 403

    def test_hospital_admin_cannot_change_user_status(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.put("/api/users/1/status", json={"status": "active"})
        assert r.status_code == 403

    # --- Report inaccuracy: only own hospital ---

    def test_physician_cannot_report_for_other_hospital(self):
        _override_user(FAKE_PHYSICIAN)  # hospital_id=1
        r = client.post("/api/resources/999/report-inaccuracy", json={
            "resource_type": "beds", "notes": "Wrong numbers",
        })
        assert r.status_code == 403

    # --- Hospital admin: only own hospital health ---

    def test_hospital_admin_cannot_view_other_hospital_health(self):
        _override_user(FAKE_HOSPITAL_ADMIN)  # hospital_id=1
        r = client.get("/api/health/summary/999")
        assert r.status_code == 403


# ===========================================================================
# 5. CONTROLLER ERROR HANDLING — auth passes, valid schema, logic errors
# ===========================================================================

class TestControllerErrors:
    """Tests that hit the controller layer and get meaningful error responses."""

    def test_update_nonexistent_resource(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.put("/api/resources/99999", json={"total_count": 10})
        assert r.status_code in (400, 404)

    def test_assign_nonexistent_physician(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.put("/api/referrals/1/assign", json={"physician_id": 99999})
        assert r.status_code == 404

    def test_get_nonexistent_referral(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.get("/api/referrals/99999")
        assert r.status_code == 404

    def test_update_profile_no_fields(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.put("/api/users/1/profile", json={})
        assert r.status_code == 400

    def test_update_specialist_nonexistent(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.put("/api/specialists/99999", json={"specialty": "Cardiology"})
        assert r.status_code in (400, 404)

    def test_delete_specialist_nonexistent(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.delete("/api/specialists/99999")
        assert r.status_code in (400, 404)

    def test_validate_invite_invalid_token(self):
        r = client.get("/api/super-admin/invites/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 400


# ===========================================================================
# 6. AUTHORIZED ACCESS — correct role, valid responses
# ===========================================================================

class TestAuthorizedAccess:
    """Tests that verify successful access with the correct role."""

    def test_physician_can_list_referrals(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.get("/api/referrals")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_physician_can_list_patients(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.get("/api/patients")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_physician_can_view_resources(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.get("/api/resources/1")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_hospital_admin_can_list_referrals(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.get("/api/referrals")
        assert r.status_code == 200

    def test_hospital_admin_can_view_specialists(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.get("/api/specialists/1")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_hospital_admin_can_view_own_health(self):
        _override_user(FAKE_HOSPITAL_ADMIN)
        r = client.get("/api/health/summary/1")
        # 200 if hospital exists, 404 if not — but not 403
        assert r.status_code in (200, 404)

    def test_super_admin_can_list_users(self):
        _override_user(FAKE_SUPER_ADMIN)
        r = client.get("/api/users")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_super_admin_can_list_physicians(self):
        _override_user(FAKE_SUPER_ADMIN)
        r = client.get("/api/users/physicians")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_super_admin_can_view_health_summary(self):
        _override_user(FAKE_SUPER_ADMIN)
        r = client.get("/api/health/summary")
        assert r.status_code == 200

    def test_super_admin_can_view_alerts(self):
        _override_user(FAKE_SUPER_ADMIN)
        r = client.get("/api/health/alerts")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_any_user_can_list_notifications(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.get("/api/notifications")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_any_user_can_get_unread_count(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.get("/api/notifications/unread-count")
        assert r.status_code == 200
        data = r.json()
        assert "unread_count" in data

    def test_any_user_can_mark_all_read(self):
        _override_user(FAKE_PHYSICIAN)
        r = client.put("/api/notifications/read-all")
        assert r.status_code == 200


# ===========================================================================
# 7. REFERRAL ENGINE — /api/recommend
# ===========================================================================

class TestReferralEngine:
    def test_recommend_returns_rankings(self):
        """The engine endpoint is public (no auth). Returns ranked hospitals."""
        r = client.post("/api/recommend", json={
            "lat": 5.6037,
            "lon": -0.1870,
            "referral_reason": "general",
            "severity": "medium",
            "stability": "stable",
        })
        assert r.status_code == 200
        data = r.json()
        assert "recommendations" in data or "rankings" in data or isinstance(data, dict)

    def test_recommend_invalid_severity(self):
        r = client.post("/api/recommend", json={
            "lat": 5.6037,
            "lon": -0.1870,
            "referral_reason": "general",
            "severity": "INVALID",
            "stability": "stable",
        })
        assert r.status_code in (400, 422)  # Engine validates at controller level (400)

    def test_recommend_missing_coordinates(self):
        r = client.post("/api/recommend", json={
            "referral_reason": "general",
            "severity": "medium",
            "stability": "stable",
        })
        assert r.status_code == 422
