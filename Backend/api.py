"""
FastAPI wrapper around the ReferralEngine.

Exposes a single POST endpoint that the frontend calls to get
hospital recommendations.  The engine itself is NOT modified —
we only import and call it.

Also mounts all CRUD route modules for the full HRS application.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()  # reads Backend/.env
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from referral_engine import (
    EngineConfig,
    Hospital,
    PatientCase,
    ReferralEngine,
    ResourceState,
)
from db import db_cursor

# Route modules
from routes_auth import router as auth_router
from routes_hospitals import router as hospitals_router
from routes_referrals import router as referrals_router
from routes_resources import router as resources_router
from routes_patients import router as patients_router
from routes_users import router as users_router
from routes_specialists import router as specialists_router

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

app = FastAPI(
    title="HRS Referral Engine API",
    description="Full Hospital Routing System API with referral engine",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,  # Required for cookie-based auth
)

# Mount route modules
app.include_router(auth_router)
app.include_router(hospitals_router)
app.include_router(referrals_router)
app.include_router(resources_router)
app.include_router(patients_router)
app.include_router(users_router)
app.include_router(specialists_router)


# ---------------------------------------------------------------------------
# Hospital data — loaded from PostgreSQL
# ---------------------------------------------------------------------------

# Mapping from DB resource_type to engine capability/resource names
RESOURCE_TYPE_MAP = {
    "icu_beds": "ICU_beds",
    "general_beds": "General_beds",
    "pediatric_beds": "Pediatric_beds",
    "maternity_beds": "Maternity_beds",
    "theatre": "OR",
    "blood_bank": "Blood_bank",
    "ventilators": "Ventilator",
    "oxygen": "Oxygen",
    "ct_scan": "CT_scan",
    "mri": "MRI",
    "ultrasound": "Ultrasound",
    "xray": "Xray",
    "lab": "Lab",
    "dialysis": "Dialysis",
}


def _load_hospitals_from_db(now: datetime) -> list[Hospital]:
    """
    Load active hospitals from PostgreSQL and convert to engine Hospital objects.
    Falls back to mock data if the DB is unavailable.
    """
    try:
        hospitals = []
        with db_cursor() as cur:
            cur.execute("SELECT * FROM hospitals WHERE status = 'active'")
            hospital_rows = cur.fetchall()

            for h in hospital_rows:
                hospital_id = str(h["hospital_id"])

                # Parse GPS coordinates (POINT type)
                lat, lon = 5.56, -0.20  # default Accra
                gps = h.get("gps_coordinates")
                if gps:
                    if isinstance(gps, str):
                        gps_clean = gps.strip("()")
                        parts = gps_clean.split(",")
                        lat, lon = float(parts[0]), float(parts[1])
                    elif isinstance(gps, tuple):
                        lat, lon = float(gps[0]), float(gps[1])

                # Determine 24/7 or operating hours
                is_24_7 = h.get("operating_hours", "").strip().lower() in ("24/7", "24 hours", "")

                # Load resources for this hospital
                cur.execute(
                    "SELECT * FROM hospital_resources WHERE hospital_id = %s",
                    (h["hospital_id"],),
                )
                resource_rows = cur.fetchall()

                capabilities = set()
                resources = {}
                for r in resource_rows:
                    rt = r["resource_type"]
                    engine_name = RESOURCE_TYPE_MAP.get(rt, rt)
                    capabilities.add(engine_name)

                    resources[engine_name] = ResourceState(
                        quantity=r.get("available_count") or 0,
                        on_call=False,
                        operational=r.get("is_available") if r.get("is_available") is not None else True,
                    )

                # Load specialists as capabilities
                cur.execute(
                    "SELECT * FROM specialists WHERE hospital_id = %s",
                    (h["hospital_id"],),
                )
                specialist_rows = cur.fetchall()
                for s in specialist_rows:
                    spec_name = s["specialty"].replace(" ", "_")
                    capabilities.add(spec_name)
                    resources[spec_name] = ResourceState(
                        on_call=s.get("on_call_available", False),
                    )

                last_update = now - timedelta(hours=2)  # default
                if resource_rows:
                    # Use the most recent resource update time
                    latest = max(
                        (r["last_updated"] for r in resource_rows if r.get("last_updated")),
                        default=None,
                    )
                    if latest:
                        last_update = latest

                hospitals.append(Hospital(
                    hospital_id=hospital_id,
                    name=h["name"],
                    lat=lat,
                    lon=lon,
                    is_24_7=is_24_7,
                    capabilities=capabilities,
                    resources=resources,
                    last_update=last_update,
                    hospital_type=h.get("type", "general").title(),
                    phone=h.get("contact_phone", ""),
                ))

        return hospitals

    except Exception as e:
        print(f"Warning: Could not load hospitals from DB ({e}). Using mock data.")
        return _load_hospitals_mock(now)


def _load_hospitals_mock(now: datetime) -> list[Hospital]:
    """Fallback mock hospital data."""
    return [
        Hospital(
            hospital_id="KBTH",
            name="Korle Bu Teaching Hospital",
            lat=5.5600, lon=-0.2057,
            is_24_7=True,
            capabilities={"ICU_beds", "Cardiologist", "Cath_lab", "Trauma_team", "OR", "Blood_bank"},
            resources={
                "ICU_beds": ResourceState(quantity=2),
                "Cardiologist": ResourceState(on_call=True),
                "Cath_lab": ResourceState(operational=True),
                "Trauma_team": ResourceState(on_call=True),
                "OR": ResourceState(operational=True),
                "Blood_bank": ResourceState(quantity=10),
            },
            last_update=now - timedelta(hours=2),
            hospital_type="Teaching", phone="0302-123-456",
        ),
        Hospital(
            hospital_id="37MH",
            name="37 Military Hospital",
            lat=5.5830, lon=-0.1850,
            is_24_7=True,
            capabilities={"ICU_beds", "Cardiologist", "Trauma_team", "OR", "Blood_bank"},
            resources={
                "ICU_beds": ResourceState(quantity=1),
                "Cardiologist": ResourceState(on_call=True),
                "Cath_lab": ResourceState(operational=False),
                "Trauma_team": ResourceState(on_call=True),
                "OR": ResourceState(operational=True),
                "Blood_bank": ResourceState(quantity=6),
            },
            last_update=now - timedelta(hours=4),
            hospital_type="Military", phone="0302-654-321",
        ),
    ]


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

VALID_EMERGENCY_TYPES = {
    "cardiac", "trauma", "respiratory", "stroke",
    "obstetric", "seizure", "general",
}
VALID_SEVERITIES = {"critical", "high", "medium", "low"}
VALID_STABILITIES = {"stable", "unstable"}


class RecommendRequest(BaseModel):
    lat: float = Field(..., description="Patient latitude (use referring hospital GPS)")
    lon: float = Field(..., description="Patient longitude (use referring hospital GPS)")
    emergency_type: str = Field(..., description="Type of emergency")
    severity: str = Field(..., description="Severity level")
    stability: str = Field(..., description="Patient stability")


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@app.post("/api/recommend")
def recommend(req: RecommendRequest):
    """
    Run the referral engine and return ranked hospital recommendations.
    This function does NOT modify the engine — it only calls engine.rank().
    """
    # Validate enums
    if req.emergency_type.lower() not in VALID_EMERGENCY_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid emergency_type '{req.emergency_type}'. "
                   f"Must be one of: {', '.join(sorted(VALID_EMERGENCY_TYPES))}",
        )
    if req.severity.lower() not in VALID_SEVERITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid severity '{req.severity}'. "
                   f"Must be one of: {', '.join(sorted(VALID_SEVERITIES))}",
        )
    if req.stability.lower() not in VALID_STABILITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stability '{req.stability}'. "
                   f"Must be one of: {', '.join(sorted(VALID_STABILITIES))}",
        )

    now = datetime.utcnow()
    hospitals = _load_hospitals_from_db(now)

    engine = ReferralEngine(
        hospitals,
        config=EngineConfig(
            radius_km=16,
            top_k=5,
            stale_half_life_hours=6,
            default_tmax_minutes=60,
        ),
    )

    patient = PatientCase(
        lat=req.lat,
        lon=req.lon,
        emergency_type=req.emergency_type.lower(),
        severity=req.severity.lower(),
        stability=req.stability.lower(),
        at_time=now,
    )

    result = engine.rank(patient)

    # Post-process: inject GPS coordinates so the frontend map can display pins.
    hospital_coords = {h.hospital_id: (h.lat, h.lon) for h in hospitals}
    for rec in result.get("recommendations", []):
        coords = hospital_coords.get(rec["hospital_id"])
        if coords:
            rec["hospital_lat"] = coords[0]
            rec["hospital_lon"] = coords[1]

    return result


# ---------------------------------------------------------------------------
# Google Maps key for frontend (Places Autocomplete, Maps JS)
# ---------------------------------------------------------------------------

@app.get("/api/maps-key")
def maps_key():
    """Return the Google Maps API key for frontend widgets."""
    if not GOOGLE_MAPS_API_KEY:
        return {"key": None, "message": "No API key configured. Set GOOGLE_MAPS_API_KEY env var."}
    return {"key": GOOGLE_MAPS_API_KEY}


# ---------------------------------------------------------------------------
# Dashboard stats endpoints
# ---------------------------------------------------------------------------

@app.get("/api/stats/physician/{physician_id}")
def physician_stats(physician_id: int):
    """Return dashboard stats for a physician."""
    with db_cursor() as cur:
        # Get physician's hospital_id
        cur.execute("SELECT hospital_id FROM physicians WHERE physician_id = %s", (physician_id,))
        phys = cur.fetchone()

        cur.execute("SELECT COUNT(*) as count FROM patients WHERE physician_id = %s", (physician_id,))
        total_patients = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) as count FROM referrals WHERE referring_physician_id = %s", (physician_id,))
        total_referrals = cur.fetchone()["count"]

        cur.execute(
            "SELECT COUNT(*) as count FROM referrals WHERE referring_physician_id = %s AND status = 'pending'",
            (physician_id,),
        )
        pending = cur.fetchone()["count"]

        cur.execute(
            "SELECT COUNT(*) as count FROM referrals WHERE referring_physician_id = %s AND status = 'completed'",
            (physician_id,),
        )
        completed = cur.fetchone()["count"]

    return {
        "total_patients": total_patients,
        "total_referrals": total_referrals,
        "pending_referrals": pending,
        "completed_referrals": completed,
    }


@app.get("/api/stats/hospital/{hospital_id}")
def hospital_stats(hospital_id: int):
    """Return dashboard stats for a hospital admin."""
    with db_cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) as count FROM referrals WHERE receiving_hospital_id = %s AND status = 'pending'",
            (hospital_id,),
        )
        pending = cur.fetchone()["count"]

        cur.execute(
            "SELECT COUNT(*) as count FROM referrals WHERE receiving_hospital_id = %s AND status = 'approved'",
            (hospital_id,),
        )
        active = cur.fetchone()["count"]

        cur.execute(
            "SELECT COUNT(*) as count FROM referrals WHERE receiving_hospital_id = %s AND status = 'completed'",
            (hospital_id,),
        )
        completed = cur.fetchone()["count"]

        cur.execute(
            "SELECT COUNT(*) as count FROM hospital_resources WHERE hospital_id = %s",
            (hospital_id,),
        )
        total_resources = cur.fetchone()["count"]

        cur.execute(
            "SELECT COUNT(*) as count FROM specialists WHERE hospital_id = %s",
            (hospital_id,),
        )
        total_specialists = cur.fetchone()["count"]

    return {
        "pending_referrals": pending,
        "active_referrals": active,
        "completed_referrals": completed,
        "total_resources": total_resources,
        "total_specialists": total_specialists,
    }


@app.get("/api/stats/admin")
def admin_stats():
    """Return dashboard stats for super admin."""
    with db_cursor() as cur:
        cur.execute("SELECT COUNT(*) as count FROM hospitals")
        total_hospitals = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) as count FROM hospitals WHERE status = 'pending'")
        pending_hospitals = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) as count FROM hospitals WHERE status = 'active'")
        active_hospitals = cur.fetchone()["count"]

        cur.execute(
            "SELECT COUNT(*) as count FROM users u JOIN role r ON u.role_id = r.role_id WHERE r.role_name = 'physician'"
        )
        total_physicians = cur.fetchone()["count"]

        cur.execute(
            "SELECT COUNT(*) as count FROM users u JOIN role r ON u.role_id = r.role_id WHERE r.role_name = 'physician' AND u.status = 'pending'"
        )
        pending_physicians = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) as count FROM referrals")
        total_referrals = cur.fetchone()["count"]

    return {
        "total_hospitals": total_hospitals,
        "pending_hospitals": pending_hospitals,
        "active_hospitals": active_hospitals,
        "total_physicians": total_physicians,
        "pending_physicians": pending_physicians,
        "total_referrals": total_referrals,
    }


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    db_status = "unknown"
    try:
        with db_cursor() as cur:
            cur.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    return {
        "status": "ok",
        "database": db_status,
        "engine": "referral_engine.py (untouched)",
        "google_maps": "configured" if GOOGLE_MAPS_API_KEY else "not configured (using Haversine fallback)",
    }
