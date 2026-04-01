import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'Backend'))

from datetime import datetime
from services.referral_engine import ReferralEngine, PatientCase, Hospital, ResourceState
from api import recommend, RecommendRequest

req = RecommendRequest(
    lat=5.56,
    lon=-0.20,
    referral_reason="cardiac",
    severity="medium",
    stability="stable"
)
try:
    res = recommend(req)
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()

