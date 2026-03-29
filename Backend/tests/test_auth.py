"""
Tests for auth Pydantic models (validation rules).

DoctorRegisterRequest now uses Supabase auth — auth_uid is required,
password is no longer part of the schema.
"""

import pytest
from pydantic import ValidationError
from endpoints.auth import DoctorRegisterRequest


def test_valid_registration():
    """A complete valid payload should succeed."""
    req = DoctorRegisterRequest(
        auth_uid="550e8400-e29b-41d4-a716-446655440000",
        full_name="Test Doctor",
        email="test@hrs.gh",
        phone_number="0501234567",
        hospital_id=1,
        license_number="MDC-123",
    )
    assert req.email == "test@hrs.gh"
    assert req.auth_uid == "550e8400-e29b-41d4-a716-446655440000"


def test_missing_auth_uid():
    """auth_uid is required (from Supabase signup)."""
    with pytest.raises(ValidationError) as exc:
        DoctorRegisterRequest(
            full_name="Test Doctor",
            email="test@hrs.gh",
            hospital_id=1,
            license_number="MDC-123",
        )
    assert "auth_uid" in str(exc.value)


def test_missing_full_name():
    with pytest.raises(ValidationError):
        DoctorRegisterRequest(
            auth_uid="550e8400-e29b-41d4-a716-446655440000",
            email="test@hrs.gh",
            hospital_id=1,
            license_number="MDC-123",
        )


def test_missing_license_number():
    with pytest.raises(ValidationError):
        DoctorRegisterRequest(
            auth_uid="550e8400-e29b-41d4-a716-446655440000",
            full_name="Test Doctor",
            email="test@hrs.gh",
            hospital_id=1,
        )


def test_email_validation():
    base_data = {
        "auth_uid": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "Test Doctor",
        "hospital_id": 1,
        "license_number": "MDC-123",
    }

    # Valid email
    req = DoctorRegisterRequest(**base_data, email="test.doc@hrs.gh")
    assert req.email == "test.doc@hrs.gh"

    # Invalid emails
    invalid_emails = ["test", "test@.com", "test@com", "test.com", "@test.com"]
    for bad_email in invalid_emails:
        with pytest.raises(ValidationError) as exc:
            DoctorRegisterRequest(**base_data, email=bad_email)
        assert "Invalid email format" in str(exc.value)


def test_optional_fields_default_to_none():
    """phone_number, title, specialization, department, grade are optional."""
    req = DoctorRegisterRequest(
        auth_uid="550e8400-e29b-41d4-a716-446655440000",
        full_name="Test Doctor",
        email="test@hrs.gh",
        hospital_id=1,
        license_number="MDC-123",
    )
    assert req.phone_number is None
    assert req.title is None
    assert req.specialization is None
    assert req.department is None
    assert req.grade is None
