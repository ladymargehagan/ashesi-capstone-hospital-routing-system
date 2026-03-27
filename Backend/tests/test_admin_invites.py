import pytest
from fastapi.testclient import TestClient
import uuid
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api import app
from models.admin_invite import create_admin_invite, get_valid_invite, mark_invite_used

client = TestClient(app)

def test_admin_invite_lifecycle():
    # 1. Create invite directly via DB model (simulating a super admin action)
    test_email = f"testadmin_{uuid.uuid4().hex[:8]}@example.com"
    hospital_id = 1
    
    # We assume user_id 1 exists (usually the super admin or a seeded doctor)
    created_by = 1 
    
    try:
        token = create_admin_invite(test_email, hospital_id, created_by)
        assert token is not None
        
        # 2. Validate invite via the endpoint
        response = client.get(f"/api/super-admin/invites/{token}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["email"] == test_email
        assert data["hospital_id"] == hospital_id
        
        # 3. Mark invite used (simulating the auth register process or calling model directly)
        mark_invite_used(token)
        
        # 4. Validate again (should fail because it's used)
        response = client.get(f"/api/super-admin/invites/{token}")
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid or expired invite token"
        
    except Exception as e:
        pytest.fail(f"Test failed with exception: {e}")
