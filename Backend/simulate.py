from __future__ import annotations

import json
from datetime import datetime, timedelta

from referral_engine import EngineConfig, Hospital, PatientCase, ReferralEngine, ResourceState


def sample_hospitals(now: datetime) -> list[Hospital]:
    return [
        Hospital(
            hospital_id="KBTH",
            name="Korle Bu Teaching Hospital",
            lat=5.5600,
            lon=-0.2057,
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
                0: [(7, 22)],
                1: [(7, 22)],
                2: [(7, 22)],
                3: [(7, 22)],
                4: [(7, 22)],
                5: [(8, 20)],
                6: [(8, 20)],
            },
            capabilities={"ICU_beds", "Cardiologist", "Cath_lab", "Ventilator", "Pulmonologist"},
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


def run_simulation() -> None:
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)

    hospitals = sample_hospitals(now)
    engine = ReferralEngine(
        hospitals,
        config=EngineConfig(
            radius_km=16,
            top_k=3,
            stale_half_life_hours=6,
            default_tmax_minutes=60,
        ),
    )

    # First test: super urgent cardiac case.
    cardiac_case = PatientCase(
        lat=5.556,
        lon=-0.196,
        emergency_type="cardiac",
        severity="critical",
        stability="unstable",
        at_time=now,
    )

    # Second test: trauma case where we still expect full-capability matches.
    trauma_case = PatientCase(
        lat=5.556,
        lon=-0.196,
        emergency_type="trauma",
        severity="high",
        stability="stable",
        at_time=now,
    )

    # Third test: night respiratory case, this helps show closed-hours + stale-data behavior.
    respiratory_case = PatientCase(
        lat=5.556,
        lon=-0.196,
        emergency_type="respiratory",
        severity="medium",
        stability="stable",
        at_time=now.replace(hour=23),
    )

    outputs = {
        "cardiac_critical_unstable": engine.rank(cardiac_case),
        "trauma_high_stable": engine.rank(trauma_case),
        "respiratory_medium_stable": engine.rank(respiratory_case),
    }

    print(json.dumps(outputs, indent=2, default=str))


if __name__ == "__main__":
    run_simulation()
