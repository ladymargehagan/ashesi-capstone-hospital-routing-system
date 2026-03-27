import pytest
from pydantic import ValidationError
from endpoints.auth import DoctorRegisterRequest

def test_password_validation():
    base_data = {
        "full_name": "Test Doctor",
        "email": "test@hrs.gh",
        "phone_number": "0501234567",
        "hospital_id": 1,
        "license_number": "MDC-123"
    }
    
    # Valid password
    req = DoctorRegisterRequest(**base_data, password="Password123!")
    assert req.password == "Password123!"
    
    # Too short
    with pytest.raises(ValidationError) as exc:
        DoctorRegisterRequest(**base_data, password="Pass1!")
    assert "at least 8 characters long" in str(exc.value)
    
    # No uppercase
    with pytest.raises(ValidationError) as exc:
        DoctorRegisterRequest(**base_data, password="password123!")
    assert "uppercase letter" in str(exc.value)
    
    # No lowercase
    with pytest.raises(ValidationError) as exc:
        DoctorRegisterRequest(**base_data, password="PASSWORD123!")
    assert "lowercase letter" in str(exc.value)

    # No number
    with pytest.raises(ValidationError) as exc:
        DoctorRegisterRequest(**base_data, password="Password!!!")
    assert "at least one number" in str(exc.value)
    
    # No special character
    with pytest.raises(ValidationError) as exc:
        DoctorRegisterRequest(**base_data, password="Password123")
    assert "special character" in str(exc.value)

def test_email_validation():
    base_data = {
        "full_name": "Test Doctor",
        "password": "Password123!",
        "phone_number": "0501234567",
        "hospital_id": 1,
        "license_number": "MDC-123"
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
