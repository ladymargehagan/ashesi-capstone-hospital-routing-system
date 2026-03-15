import pytest
from fastapi.testclient import TestClient

# Import the FastAPI app from api.py
from api import app

client = TestClient(app)

# Dummy test classes to match your documentation table names

class TestCreateReferralTestCase:
    def test_create_referral_validation(self):
        """Test creating a referral fails without patient_id"""
        response = client.post("/api/referrals", json={
            "referring_physician_id": 1,
            "referring_hospital_id": 1,
            "receiving_hospital_id": 2,
            "severity": "high",
            "stability": "stable",
            "presenting_complaint": "Chest pain"
        })
        assert response.status_code == 422 # Validation error from Pydantic

class TestUpdateResourceTestCase:
    def test_update_resource_invalid_id(self):
        """Test updating a non-existent resource"""
        response = client.put("/api/resources/9999", json={
            "current_capacity": 5
        })
        assert response.status_code == 404

class TestUpdateReferralStatusTestCase:
    def test_invalid_status(self):
        """Test updating referral with invalid status"""
        response = client.put("/api/referrals/1/status", json={
            "status": "invalid_status"
        })
        assert response.status_code == 400

class TestAddSpecialistTestCase:
    def test_add_specialist_validation(self):
        """Test adding a specialist requires hospital_id"""
        response = client.post("/api/specialists", json={
            "specialty": "Cardiology"
        })
        assert response.status_code == 422

class TestAssignReferralTestCase:
    def test_assign_invalid_physician(self):
        """Test assigning a referral with invalid physician"""
        # Our endpoint expects a valid physician, let's pass a known invalid one
        response = client.put("/api/referrals/1/assign", json={
            "physician_id": 9999
        })
        assert response.status_code == 404

class TestCreatePatientTestCase:
    def test_create_patient_validation(self):
        """Test creating a patient requires full_name"""
        response = client.post("/api/patients", json={
            "hospital_id": 1,
            "contact_number": "1234567890"
        })
        assert response.status_code == 422

# Let's also add some basic GET tests that should pass cleanly
def test_get_hospitals_list():
    """Test retrieving list of hospitals"""
    response = client.get("/api/hospitals")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_resources():
    """Test retrieving resources for a known hospital"""
    response = client.get("/api/resources/1")
    # Even if empty, should be a 200 with a list
    assert response.status_code == 200
    assert isinstance(response.json(), list)
