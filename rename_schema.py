import os

files_to_update = [
    "Backend/services/referral_engine.py",
    "Backend/controllers/referral_controller.py",
    "Backend/models/referral.py",
    "Backend/api.py",
    "Backend/simulate.py",
    "Backend/endpoints/referrals.py",
    "frontend/src/lib/referral-api.ts",
    "frontend/src/lib/api-client.ts",
    "frontend/src/app/physician/referral/page.tsx",
    "frontend/src/types/index.ts"
]

for filepath in files_to_update:
    full_path = os.path.join(os.getcwd(), filepath)
    if os.path.exists(full_path):
        with open(full_path, 'r') as f:
            content = f.read()
        
        content = content.replace("emergency_type", "referral_reason")
        content = content.replace("EmergencyType", "ReferralReason")
        content = content.replace("Emergency Type", "Referral Reason")
        content = content.replace("emergency type", "referral reason")
        content = content.replace("VALID_EMERGENCY_TYPES", "VALID_REFERRAL_REASONS")
        
        with open(full_path, 'w') as f:
            f.write(content)
        print(f"Updated {full_path}")
    else:
        print(f"File not found: {full_path}")
