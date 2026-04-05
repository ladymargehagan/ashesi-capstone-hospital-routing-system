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
from collections import defaultdict
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()  # reads Backend/.env
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.referral_engine import (
    EngineConfig,
    Hospital,
    PatientCase,
    ReferralEngine,
    ResourceState,
)
from core.db import db_cursor

# Route modules
from endpoints.auth import router as auth_router
from endpoints.hospitals import router as hospitals_router
from endpoints.referrals import router as referrals_router
from endpoints.resources import router as resources_router
from endpoints.patients import router as patients_router
from endpoints.users import router as users_router
from endpoints.specialists import router as specialists_router
from endpoints.notifications import router as notifications_router
from endpoints.options import router as options_router
from endpoints.super_admin import router as super_admin_router
from endpoints.health import router as health_router

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

app = FastAPI(
    title="HRS Referral Engine API",
    description="Full Hospital Routing System API with referral engine",
    version="2.0.0",
)

cors_origins = [
    origin.strip().rstrip('/')
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://ashesi-capstone-hospital-routing-sy.vercel.app"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Mount route modules
app.include_router(auth_router)
app.include_router(hospitals_router)
app.include_router(referrals_router)
app.include_router(resources_router)
app.include_router(patients_router)
app.include_router(users_router)
app.include_router(specialists_router)
app.include_router(notifications_router)
app.include_router(options_router)
app.include_router(super_admin_router)
app.include_router(health_router, prefix="/api/health", tags=["health"])

# ---------------------------------------------------------------------------
# Background Tasks
# ---------------------------------------------------------------------------
import asyncio
from services.email_service import notify_referral_created, notify_referral_status_changed

async def referral_timeout_sweep():
    """Background task to automatically reject and reroute timed-out pending referrals."""
    while True:
        try:
            with db_cursor() as cur:
                cur.execute("SELECT referral_id, patient_id, severity, stability, submitted_at, routing_queue FROM referrals WHERE status = 'pending'")
                pending = cur.fetchall()

            now = datetime.utcnow()
            for r in pending:
                # Dynamic timeout calculation
                if r["severity"] == "critical" or r["stability"] == "unstable":
                    timeout_mins = 15
                elif r["severity"] == "high":
                    timeout_mins = 30
                elif r["severity"] == "medium":
                    timeout_mins = 60
                else:
                    timeout_mins = 120
                
                # Check for expiration
                if (now - r.get("submitted_at", now)).total_seconds() > timeout_mins * 60:
                    queue = r.get("routing_queue") or []
                    if isinstance(queue, str):
                        try:
                            queue = json.loads(queue)
                        except:
                            queue = []
                    
                    with db_cursor() as cur:
                        if not queue:
                            # Exhausted
                            cur.execute(
                                "UPDATE referrals SET status = 'cancelled', cancellation_reason = 'Routing queue exhausted — no hospitals accepted' WHERE referral_id = %s",
                                (r["referral_id"],)
                            )
                            # NOTE: In production, notify referring physician here.
                        else:
                            # Pop next hospital
                            next_hospital_id = queue.pop(0)
                            cur.execute(
                                "UPDATE referrals SET receiving_hospital_id = %s, routing_queue = %s, submitted_at = %s WHERE referral_id = %s",
                                (next_hospital_id, json.dumps(queue), now, r["referral_id"])
                            )
                            
                            # Notify new receiving hospital
                            cur.execute("SELECT full_name FROM patients WHERE patient_id = %s", (r["patient_id"],))
                            p = cur.fetchone()
                            patient_name = p["full_name"] if p else "Unknown"
                            
                            # Get referring physician user_id for notification
                            cur.execute(
                                """
                                SELECT u.user_id 
                                FROM referrals r2 
                                JOIN physicians ph ON r2.referring_physician_id = ph.physician_id
                                JOIN users u ON ph.user_id = u.user_id
                                WHERE r2.referral_id = %s
                                """,
                                (r["referral_id"],)
                            )
                            phys_row = cur.fetchone()
                            
                            try:
                                # Run synchronously for now in this loop
                                notify_referral_created(r["referral_id"], patient_name, next_hospital_id)
                                if phys_row:
                                    notify_referral_status_changed(
                                        r["referral_id"], 
                                        patient_name, 
                                        "timeout_cascaded", 
                                        phys_row["user_id"]
                                    )
                            except Exception as e:
                                print(f"[WARN] Email notification failed dynamically: {e}")

        except Exception as e:
            print(f"[WARN] Referral timeout sweep failed: {e}")
            
        await asyncio.sleep(60) # Sweep every 60 seconds

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(referral_timeout_sweep())


# ---------------------------------------------------------------------------
# Hospital data — loaded from PostgreSQL
# ---------------------------------------------------------------------------

# Maps the DB resource_type column to the capability key the engine uses.
# We keep both in snake_case so there's no translation ambiguity.
# If a new resource type is added to the DB schema, add it here too.
RESOURCE_TYPE_MAP = {
    "general_beds":    "general_beds",
    "emergency_beds":  "emergency_beds",
    "icu_beds":        "icu_beds",
    "stroke_beds":     "stroke_beds",
    "pediatric_beds":  "pediatric_beds",
    "maternity_beds":  "maternity_beds",
    "oxygen_beds":     "oxygen_beds",
    "monitored_beds":  "monitored_beds",
    "adjustable_beds": "adjustable_beds",
    "theatre":         "theatre",
    "blood_bank":      "blood_bank",
    "lab":             "lab",
    "xray":            "xray",
    "ct_scan":         "ct_scan",
    "mri":             "mri",
    "ultrasound":      "ultrasound",
    "dialysis":        "dialysis",
    "ventilators":     "ventilators",
    "oxygen":          "oxygen",
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
            
            if not hospital_rows:
                return []

            hospital_ids = tuple(h["hospital_id"] for h in hospital_rows)

            # Batch load resources
            cur.execute(
                "SELECT * FROM hospital_resources WHERE hospital_id IN %s",
                (hospital_ids,)
            )
            all_resources = cur.fetchall()
            resources_by_hospital = defaultdict(list)
            for r in all_resources:
                resources_by_hospital[str(r["hospital_id"])].append(r)

            # Batch load physician specializations (active physicians with a specialization)
            cur.execute(
                """
                SELECT p.specialization, p.availability, u.hospital_id, u.full_name
                FROM physicians p
                JOIN users u ON p.user_id = u.user_id
                WHERE u.hospital_id IN %s
                  AND p.status = 'active'
                  AND p.specialization IS NOT NULL
                  AND p.specialization != ''
                """,
                (hospital_ids,)
            )
            all_specialists = cur.fetchall()
            specialists_by_hospital = defaultdict(list)
            for s in all_specialists:
                specialists_by_hospital[str(s["hospital_id"])].append(s)

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
                oper_hrs = h.get("operating_hours")
                is_24_7 = (oper_hrs or "").strip().lower() in ("24/7", "24 hours", "")

                resource_rows = resources_by_hospital.get(hospital_id, [])
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

                # Load physician specializations as capabilities
                specialist_rows = specialists_by_hospital.get(hospital_id, [])
                for s in specialist_rows:
                    spec_name = s["specialization"].replace(" ", "_")
                    capabilities.add(spec_name)
                    # A physician with availability=True counts as on-call
                    existing = resources.get(spec_name)
                    if existing and existing.on_call:
                        continue  # already have an on-call specialist for this
                    resources[spec_name] = ResourceState(
                        on_call=bool(s.get("availability", False)),
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
                    hospital_type=h.get("level", "health_centre").replace("_", " ").title(),
                    hospital_level=h.get("level", "health_centre"),
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

VALID_REFERRAL_REASONS = {
    "cardiac", "trauma", "respiratory", "stroke",
    "obstetric", "seizure", "general",
}
VALID_SEVERITIES = {"critical", "high", "medium", "low"}
VALID_STABILITIES = {"stable", "unstable"}


class RecommendRequest(BaseModel):
    lat: float = Field(..., description="Patient latitude (use referring hospital GPS)")
    lon: float = Field(..., description="Patient longitude (use referring hospital GPS)")
    referral_reason: str = Field(..., description="Type of emergency")
    severity: str = Field(..., description="Severity level")
    stability: str = Field(..., description="Patient stability")
    referring_hospital_id: Optional[int] = Field(None, description="Hospital making the referral (excluded from results)")


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@app.post("/api/recommend")
def recommend(req: RecommendRequest):
    """
    Run the referral engine and return ranked hospital recommendations.
    This function does NOT modify the engine — it only calls engine.rank().
    """
    import time
    t0 = time.time()
    print(f"[RECOMMEND] Request received: reason={req.referral_reason}, severity={req.severity}, "
          f"stability={req.stability}, referring_hospital_id={req.referring_hospital_id}")

    # Validate enums
    if req.referral_reason.lower() not in VALID_REFERRAL_REASONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid referral_reason '{req.referral_reason}'. "
                   f"Must be one of: {', '.join(sorted(VALID_REFERRAL_REASONS))}",
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

    try:
        now = datetime.utcnow()
        hospitals = _load_hospitals_from_db(now)
        print(f"[RECOMMEND] Loaded {len(hospitals)} hospitals in {time.time()-t0:.2f}s")

        # Exclude the referring hospital so it doesn't recommend itself
        if req.referring_hospital_id is not None:
            exclude_id = str(req.referring_hospital_id)
            hospitals = [h for h in hospitals if h.hospital_id != exclude_id]

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
            referral_reason=req.referral_reason.lower(),
            severity=req.severity.lower(),
            stability=req.stability.lower(),
            at_time=now,
        )

        result = engine.rank(patient)
        print(f"[RECOMMEND] Engine ranked in {time.time()-t0:.2f}s, "
              f"{len(result.get('recommendations', []))} results")

        # Post-process: inject GPS coordinates so the frontend map can display pins.
        hospital_coords = {h.hospital_id: (h.lat, h.lon) for h in hospitals}
        for rec in result.get("recommendations", []):
            coords = hospital_coords.get(rec["hospital_id"])
            if coords:
                rec["hospital_lat"] = coords[0]
                rec["hospital_lon"] = coords[1]

        print(f"[RECOMMEND] Total time: {time.time()-t0:.2f}s")
        return result

    except Exception as e:
        print(f"[RECOMMEND] ERROR after {time.time()-t0:.2f}s: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")


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
        # Get physician's hospital_id (lives on users table)
        cur.execute(
            "SELECT u.hospital_id FROM physicians p JOIN users u ON p.user_id = u.user_id WHERE p.physician_id = %s",
            (physician_id,),
        )
        phys = cur.fetchone()

        cur.execute("SELECT COUNT(*) as count FROM patients WHERE physician_id = %s", (physician_id,))
        total_patients = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) as count FROM referrals WHERE referring_physician_id = %s", (physician_id,))
        referrals_sent = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) as count FROM referrals WHERE assigned_physician_id = %s", (physician_id,))
        referrals_received = cur.fetchone()["count"]

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
        "referrals_sent": referrals_sent,
        "referrals_received": referrals_received,
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
            """
            SELECT COUNT(*) as count FROM physicians p
            JOIN users u ON p.user_id = u.user_id
            WHERE u.hospital_id = %s
              AND p.status = 'active'
              AND p.specialization IS NOT NULL
              AND p.specialization != ''
            """,
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

    from services.email_service import _get_smtp_config
    _, _, smtp_user, smtp_password, _ = _get_smtp_config()

    return {
        "status": "ok",
        "database": db_status,
        "engine": "referral_engine.py (untouched)",
        "google_maps": "configured" if GOOGLE_MAPS_API_KEY else "not configured (using Haversine fallback)",
        "email": {
            "smtp_user": f"set ({smtp_user[:3]}...)" if smtp_user else "EMPTY",
            "smtp_password": f"set ({len(smtp_password)} chars)" if smtp_password else "EMPTY",
            "enabled": bool(smtp_user and smtp_password),
        },
    }
