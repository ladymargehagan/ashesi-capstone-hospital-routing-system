"""
FastAPI wrapper around the ReferralEngine.

Exposes a single POST endpoint that the frontend calls to get
hospital recommendations.  The engine itself is NOT modified —
we only import and call it.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
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

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="HRS Referral Engine API",
    description="Thin wrapper around the Hospital Referral Engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Hospital data  (same seed data from simulate.py — later swap for DB query)
# ---------------------------------------------------------------------------

def _load_hospitals(now: datetime) -> list[Hospital]:
    """
    Returns the sample hospital set used by simulate.py.
    In production, replace this with a database query.
    """
    return [
        Hospital(
            hospital_id="KBTH",
            name="Korle Bu Teaching Hospital",
            lat=5.5600,
            lon=-0.2057,
            is_24_7=True,
            capabilities={
                "ICU_beds", "Cardiologist", "Cath_lab",
                "Trauma_team", "OR", "Blood_bank",
            },
            resources={
                "ICU_beds": ResourceState(quantity=2),
                "Cardiologist": ResourceState(on_call=True),
                "Cath_lab": ResourceState(operational=True),
                "Trauma_team": ResourceState(on_call=True),
                "OR": ResourceState(operational=True),
                "Blood_bank": ResourceState(quantity=10),
            },
            last_update=now - timedelta(hours=2),
            hospital_type="Teaching",
            phone="0302-123-456",
            travel_time_override_mins=15,
        ),
        Hospital(
            hospital_id="37MH",
            name="37 Military Hospital",
            lat=5.5830,
            lon=-0.1850,
            is_24_7=True,
            capabilities={
                "ICU_beds", "Cardiologist",
                "Trauma_team", "OR", "Blood_bank",
            },
            resources={
                "ICU_beds": ResourceState(quantity=1),
                "Cardiologist": ResourceState(on_call=True),
                "Cath_lab": ResourceState(operational=False),
                "Trauma_team": ResourceState(on_call=True),
                "OR": ResourceState(operational=True),
                "Blood_bank": ResourceState(quantity=6),
            },
            last_update=now - timedelta(hours=4),
            hospital_type="Military",
            phone="0302-654-321",
            travel_time_override_mins=8,
        ),
        Hospital(
            hospital_id="RIDGE",
            name="Ridge Regional Hospital",
            lat=5.5605,
            lon=-0.1860,
            is_24_7=False,
            operating_hours={
                0: [(7, 22)], 1: [(7, 22)], 2: [(7, 22)],
                3: [(7, 22)], 4: [(7, 22)],
                5: [(8, 20)], 6: [(8, 20)],
            },
            capabilities={
                "ICU_beds", "Cardiologist", "Cath_lab",
                "Ventilator", "Pulmonologist",
            },
            resources={
                "ICU_beds": ResourceState(quantity=0),
                "Cardiologist": ResourceState(on_call=True),
                "Cath_lab": ResourceState(operational=True),
                "Ventilator": ResourceState(quantity=3),
                "Pulmonologist": ResourceState(on_call=True),
            },
            last_update=now - timedelta(hours=8),
            hospital_type="Regional",
            phone="0302-111-222",
            travel_time_override_mins=12,
        ),
        Hospital(
            hospital_id="LEKMA",
            name="LEKMA Hospital",
            lat=5.6030,
            lon=-0.1300,
            is_24_7=True,
            capabilities={"Ventilator", "ICU_beds", "Pulmonologist"},
            resources={
                "Ventilator": ResourceState(quantity=2),
                "ICU_beds": ResourceState(quantity=1),
                "Pulmonologist": ResourceState(on_call=False),
            },
            last_update=now - timedelta(hours=12),
            hospital_type="General",
            phone="0302-333-444",
            travel_time_override_mins=25,
        ),
        Hospital(
            hospital_id="TEMA",
            name="Tema General Hospital",
            lat=5.6690,
            lon=-0.0166,
            is_24_7=True,
            capabilities={"ICU_beds", "Cardiologist", "Cath_lab"},
            resources={
                "ICU_beds": ResourceState(quantity=1),
                "Cardiologist": ResourceState(on_call=True),
                "Cath_lab": ResourceState(operational=True),
            },
            last_update=now - timedelta(hours=1),
            hospital_type="General",
            phone="0303-555-666",
            travel_time_override_mins=45,
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
    hospitals = _load_hospitals(now)

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

    return result


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "engine": "referral_engine.py (untouched)"}
