from __future__ import annotations

import hashlib
import math
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple

try:
    import requests
except Exception:  # pragma: no cover
    requests = None


# Just k=eeping this simple: Monday=0 and Sunday=6.
DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


@dataclass
class ResourceState:
    quantity: int = 0
    on_call: bool = False
    operational: bool = False

    def is_available(self) -> bool:
        # If any signal looks good, we say the resource is available.
        return self.quantity > 0 or self.on_call or self.operational


@dataclass
class Hospital:
    hospital_id: str
    name: str
    lat: float
    lon: float
    is_24_7: bool
    operating_hours: Dict[int, List[Tuple[int, int]]] = field(default_factory=dict)
    capabilities: Set[str] = field(default_factory=set)
    resources: Dict[str, ResourceState] = field(default_factory=dict)
    last_update: datetime = field(default_factory=datetime.utcnow)
    hospital_type: str = "General"
    phone: str = "N/A"
    travel_time_override_mins: Optional[float] = None

    def is_open(self, at_time: datetime) -> bool:
        if self.is_24_7:
            return True

        windows = self.operating_hours.get(at_time.weekday(), [])
        hour = at_time.hour
        for start_hour, end_hour in windows:
            if start_hour <= hour < end_hour:
                return True
        return False


@dataclass
class PatientCase:
    lat: float
    lon: float
    emergency_type: str
    severity: str
    stability: str
    at_time: datetime = field(default_factory=datetime.utcnow)


@dataclass
class EngineConfig:
    radius_km: float = 16.0
    top_k: int = 3
    stale_half_life_hours: float = 6.0
    default_tmax_minutes: int = 60
    base_capability_weight: float = 0.7
    base_proximity_weight: float = 0.3
    road_speed_kmh: float = 30.0
    road_multiplier: float = 1.35
    cms_width: int = 256
    cms_depth: int = 5
    distance_bucket_km: float = 0.5


class CountMinSketch:
    def __init__(self, width: int = 256, depth: int = 5) -> None:
        self.width = width
        self.depth = depth
        self.table = [[0 for _ in range(width)] for _ in range(depth)]

    def _idx(self, key: str, row: int) -> int:
        digest = hashlib.blake2b(f"{row}:{key}".encode("utf-8"), digest_size=8).hexdigest()
        return int(digest, 16) % self.width

    def add(self, key: str, count: int = 1) -> None:
        for row in range(self.depth):
            col = self._idx(key, row)
            self.table[row][col] += count

    def estimate(self, key: str) -> int:
        return min(self.table[row][self._idx(key, row)] for row in range(self.depth))


class DistanceLookup:
    def __init__(self, bucket_km: float, cms_width: int, cms_depth: int) -> None:
        self.bucket_km = bucket_km
        self.cms = CountMinSketch(width=cms_width, depth=cms_depth)
        self.exact_distance_by_hospital: Dict[str, float] = {}

    def _bucket_key(self, distance_km: float) -> str:
        bucket = int(distance_km / self.bucket_km)
        return f"bucket:{bucket}"

    def add_distance(self, hospital_id: str, distance_km: float) -> None:
        self.exact_distance_by_hospital[hospital_id] = distance_km
        self.cms.add(self._bucket_key(distance_km), 1)

    def get_exact_distance(self, hospital_id: str) -> Optional[float]:
        return self.exact_distance_by_hospital.get(hospital_id)

    def estimate_density_near(self, distance_km: float) -> int:
        # Quick way to guess how many hospitals are in this distance bucket.
        return self.cms.estimate(self._bucket_key(distance_km))


class TravelTimeProvider:
    def __init__(self, config: EngineConfig, google_api_key: Optional[str] = None) -> None:
        self.config = config
        self.google_api_key = google_api_key or os.getenv("GOOGLE_MAPS_API_KEY")

    def get_travel_time_minutes(
        self,
        origin: Tuple[float, float],
        hospital: Hospital,
        fallback_distance_km: float,
    ) -> float:
        if hospital.travel_time_override_mins is not None:
            return max(0.0, float(hospital.travel_time_override_mins))

        if self.google_api_key and requests is not None:
            api_time = self._google_distance_matrix_minutes(origin, (hospital.lat, hospital.lon))
            if api_time is not None:
                return api_time

        return self._estimated_drive_time_minutes(fallback_distance_km)

    def _estimated_drive_time_minutes(self, distance_km: float) -> float:
        effective_km = distance_km * self.config.road_multiplier
        minutes = (effective_km / self.config.road_speed_kmh) * 60.0
        return max(1.0, minutes)

    def _google_distance_matrix_minutes(
        self, origin: Tuple[float, float], destination: Tuple[float, float]
    ) -> Optional[float]:
        if not self.google_api_key or requests is None:
            return None

        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params = {
            "origins": f"{origin[0]},{origin[1]}",
            "destinations": f"{destination[0]},{destination[1]}",
            "mode": "driving",
            "departure_time": "now",
            "key": self.google_api_key,
        }

        try:
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            body = response.json()
            rows = body.get("rows", [])
            if not rows or not rows[0].get("elements"):
                return None

            element = rows[0]["elements"][0]
            if element.get("status") != "OK":
                return None

            seconds = element.get("duration_in_traffic", element.get("duration", {})).get("value")
            if seconds is None:
                return None
            return float(seconds) / 60.0
        except Exception:
            return None


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return radius * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


REQUIRED_RESOURCES: Dict[str, Dict[str, float]] = {
    "cardiac": {"ICU_beds": 0.5, "Cardiologist": 0.3, "Cath_lab": 0.2},
    "trauma": {"Trauma_team": 0.4, "OR": 0.3, "Blood_bank": 0.3},
    "respiratory": {"Ventilator": 0.5, "ICU_beds": 0.3, "Pulmonologist": 0.2},
    "stroke": {"Neurologist": 0.4, "CT_scan": 0.3, "ICU_beds": 0.3},
    "obstetric": {"OB_team": 0.5, "OR": 0.3, "Neonatal_ICU": 0.2},
    "seizure": {"Neurologist": 0.4, "EEG": 0.3, "ICU_beds": 0.3},
    "general": {"General_beds": 0.5, "On_call_doctor": 0.3, "Basic_equipment": 0.2},
}


PROXIMITY_PREFERENCE: Dict[Tuple[str, str], float] = {
    ("critical", "unstable"): 0.6,
    ("critical", "stable"): 0.4,
    ("high", "unstable"): 0.5,
    ("high", "stable"): 0.3,
    ("medium", "unstable"): 0.4,
    ("medium", "stable"): 0.3,
    ("low", "stable"): 0.3,
}


TMAX_BY_CONTEXT: Dict[Tuple[str, str], int] = {
    ("critical", "unstable"): 30,
    ("critical", "stable"): 45,
    ("high", "unstable"): 40,
    ("high", "stable"): 60,
    ("medium", "unstable"): 50,
    ("medium", "stable"): 60,
    ("low", "stable"): 60,
}


class ReferralEngine:
    def __init__(self, hospitals: Sequence[Hospital], config: Optional[EngineConfig] = None) -> None:
        self.hospitals = list(hospitals)
        self.config = config or EngineConfig()
        self.travel_time_provider = TravelTimeProvider(self.config)

    def rank(self, patient: PatientCase) -> Dict[str, Any]:
        required = self._required_resources(patient.emergency_type)
        warnings: List[str] = []

        # first, we calcualte distance for everyone, and keep nearby hospitals.
        # We also fill a count-min sketch so distance lookups stay fast.
        distance_lookup = DistanceLookup(
            bucket_km=self.config.distance_bucket_km,
            cms_width=self.config.cms_width,
            cms_depth=self.config.cms_depth,
        )

        nearby: List[Hospital] = []
        for hospital in self.hospitals:
            distance = haversine_km(patient.lat, patient.lon, hospital.lat, hospital.lon)
            distance_lookup.add_distance(hospital.hospital_id, distance)
            if distance <= self.config.radius_km:
                nearby.append(hospital)

        # second, if hospital is closed right now, we skip it.
        open_now = [h for h in nearby if h.is_open(patient.at_time)]

        # third, hospital must have all needed capabilities.
        required_keys = set(required.keys())
        capable = [h for h in open_now if required_keys.issubset(h.capabilities)]

        used_partial_fallback = False
        if not capable:
            used_partial_fallback = True
            # no full match, so we fallback and still give best partial options.
            warnings.append(
                "No fully capable hospital found. Showing partial matches ranked by matched capability and proximity."
            )
            return self._rank_partial_matches(
                patient=patient,
                hospitals=open_now,
                required=required,
                distance_lookup=distance_lookup,
                warnings=warnings,
                total_nearby=len(nearby),
                total_open_now=len(open_now),
            )

        alpha, beta = self._dynamic_weights(patient.severity, patient.stability)
        tmax = TMAX_BY_CONTEXT.get(
            (patient.severity.lower(), patient.stability.lower()), self.config.default_tmax_minutes
        )

        scored: List[Dict[str, Any]] = []
        for hospital in capable:
            distance_km = distance_lookup.get_exact_distance(hospital.hospital_id)
            if distance_km is None:
                continue

            resource_score, resource_breakdown = self._resource_score(hospital, required)
            travel_mins = self.travel_time_provider.get_travel_time_minutes(
                origin=(patient.lat, patient.lon),
                hospital=hospital,
                fallback_distance_km=distance_km,
            )
            # close hospitals get higher score; beyond thresehold goes to 0.
            proximity_score = max(0.0, 1.0 - (travel_mins / float(tmax)))
            freshness_factor = self._freshness_factor(hospital.last_update, patient.at_time)

            # final score mixes capability + proximity, then freshness penalty.
            composite = freshness_factor * (alpha * resource_score + beta * proximity_score)
            scored.append(
                {
                    "hospital": hospital,
                    "distance_km": distance_km,
                    "travel_time_minutes": travel_mins,
                    "resource_score": resource_score,
                    "proximity_score": proximity_score,
                    "freshness_factor": freshness_factor,
                    "composite_score": composite,
                    "resource_breakdown": resource_breakdown,
                    "distance_band_density_estimate": distance_lookup.estimate_density_near(distance_km),
                }
            )

        if scored and all(item["freshness_factor"] < 0.3 for item in scored):
            warnings.append(
                "Hospital data is stale (>10 hours old equivalent confidence). Call to confirm before transfer."
            )

        if scored and all(item["proximity_score"] == 0.0 for item in scored):
            warnings.append("All capable hospitals are beyond preferred travel-time threshold. T_max was extended.")
            tmax *= 2
            # Re-score once with a looser travel window so we can still rank.
            for item in scored:
                travel = item["travel_time_minutes"]
                item["proximity_score"] = max(0.0, 1.0 - (travel / float(tmax)))
                item["composite_score"] = item["freshness_factor"] * (
                    alpha * item["resource_score"] + beta * item["proximity_score"]
                )

        scored.sort(
            key=lambda x: (
                x["composite_score"],
                x["freshness_factor"],
                x["resource_score"],
                -x["travel_time_minutes"],
            ),
            reverse=True,
        )

        top = scored[: self.config.top_k]
        recommendations = [
            self._to_recommendation(rank + 1, row, required_keys, patient.at_time)
            for rank, row in enumerate(top)
        ]

        return {
            "input_summary": {
                "emergency_type": patient.emergency_type,
                "severity": patient.severity,
                "stability": patient.stability,
                "time": patient.at_time.isoformat(),
                "radius_km": self.config.radius_km,
            },
            "debug": {
                "counts": {
                    "total": len(self.hospitals),
                    "nearby": len(nearby),
                    "open_now": len(open_now),
                    "capable": len(capable),
                    "partial_fallback_used": used_partial_fallback,
                },
                "weights": {"alpha_capability": alpha, "beta_proximity": beta},
                "tmax_minutes": tmax,
            },
            "warnings": warnings,
            "recommendations": recommendations,
        }

    def _rank_partial_matches(
        self,
        patient: PatientCase,
        hospitals: Iterable[Hospital],
        required: Dict[str, float],
        distance_lookup: DistanceLookup,
        warnings: List[str],
        total_nearby: int,
        total_open_now: int,
    ) -> Dict[str, Any]:
        severity = patient.severity.lower()
        stability = patient.stability.lower()
        tmax = TMAX_BY_CONTEXT.get((severity, stability), self.config.default_tmax_minutes)
        alpha, beta = self._dynamic_weights(severity, stability)

        rows: List[Dict[str, Any]] = []
        hospitals_list = list(hospitals)
        req_keys = set(required.keys())
        for hospital in hospitals_list:
            distance = distance_lookup.get_exact_distance(hospital.hospital_id)
            if distance is None:
                continue

            matched = len(req_keys.intersection(hospital.capabilities))
            match_ratio = matched / max(1, len(req_keys))
            travel_mins = self.travel_time_provider.get_travel_time_minutes(
                origin=(patient.lat, patient.lon), hospital=hospital, fallback_distance_km=distance
            )
            proximity = max(0.0, 1.0 - (travel_mins / float(tmax)))
            partial_score = alpha * match_ratio + beta * proximity
            freshness = self._freshness_factor(hospital.last_update, patient.at_time)

            resource_breakdown = {}
            for key in req_keys:
                state = hospital.resources.get(key, ResourceState())
                resource_breakdown[key] = {
                    "available": float(state.is_available()),
                    "quantity": state.quantity,
                    "on_call": state.on_call,
                    "operational": state.operational,
                }

            rows.append(
                {
                    "hospital": hospital,
                    "distance_km": distance,
                    "travel_time_minutes": travel_mins,
                    "resource_score": match_ratio,
                    "proximity_score": proximity,
                    "freshness_factor": freshness,
                    # in fallback mode we recieve a softer score: partial capability * proximity * freshness.
                    "composite_score": partial_score * freshness,
                    "resource_breakdown": resource_breakdown,
                    "distance_band_density_estimate": distance_lookup.estimate_density_near(distance),
                }
            )

        if rows and all(item["freshness_factor"] < 0.3 for item in rows):
            warnings.append(
                "Hospital data is stale (>10 hours old equivalent confidence). Call to confirm before transfer."
            )

        rows.sort(
            key=lambda x: (
                x["composite_score"],
                x["freshness_factor"],
                x["resource_score"],
                -x["travel_time_minutes"],
            ),
            reverse=True,
        )

        top_rows = rows[: self.config.top_k]
        recommendations = [
            self._to_recommendation(rank + 1, row, req_keys, patient.at_time)
            for rank, row in enumerate(top_rows)
        ]

        return {
            "input_summary": {
                "emergency_type": patient.emergency_type,
                "severity": patient.severity,
                "stability": patient.stability,
                "time": patient.at_time.isoformat(),
                "radius_km": self.config.radius_km,
            },
            "debug": {
                "counts": {
                    "total": len(self.hospitals),
                    "nearby": total_nearby,
                    "open_now": total_open_now,
                    "capable": 0,
                    "partial_fallback_used": True,
                },
                "weights": {"alpha_capability": 1.0, "beta_proximity": 1.0},
                "tmax_minutes": tmax,
            },
            "warnings": warnings,
            "recommendations": recommendations,
        }

    def _to_recommendation(
        self, rank: int, row: Dict[str, Any], required_keys: Set[str], at_time: datetime
    ) -> Dict[str, Any]:
        hospital: Hospital = row["hospital"]
        return {
            "rank": rank,
            "hospital_name": hospital.name,
            "hospital_id": hospital.hospital_id,
            "hospital_type": hospital.hospital_type,
            "contact": hospital.phone,
            "distance_km": round(row["distance_km"], 2),
            "travel_time_minutes": round(row["travel_time_minutes"], 1),
            "composite_score": round(row["composite_score"], 4),
            "resource_score": round(row["resource_score"], 4),
            "proximity_score": round(row["proximity_score"], 4),
            "freshness_factor": round(row["freshness_factor"], 4),
            "last_update_hours_ago": round(
                max(0.0, (at_time - hospital.last_update).total_seconds() / 3600.0), 2
            ),
            "resource_availability": [
                {
                    "resource": key,
                    "available": bool(row["resource_breakdown"].get(key, {}).get("available", 0.0)),
                    "details": row["resource_breakdown"].get(key, {}),
                }
                for key in sorted(required_keys)
            ],
            "distance_band_density_estimate": row["distance_band_density_estimate"],
        }

    def _required_resources(self, emergency_type: str) -> Dict[str, float]:
        key = emergency_type.lower().strip()
        if key not in REQUIRED_RESOURCES:
            raise ValueError(
                f"Unknown emergency type '{emergency_type}'. Supported: {', '.join(sorted(REQUIRED_RESOURCES.keys()))}"
            )
        return REQUIRED_RESOURCES[key]

    def _resource_score(self, hospital: Hospital, required: Dict[str, float]) -> Tuple[float, Dict[str, Dict[str, Any]]]:
        # weighted score: more critical resources matter more.
        numerator = 0.0
        denominator = 0.0
        breakdown: Dict[str, Dict[str, Any]] = {}

        for resource_name, weight in required.items():
            state = hospital.resources.get(resource_name, ResourceState())
            availability = 1.0 if state.is_available() else 0.0
            numerator += weight * availability
            denominator += weight
            breakdown[resource_name] = {
                "available": availability,
                "quantity": state.quantity,
                "on_call": state.on_call,
                "operational": state.operational,
                "weight": weight,
            }

        if denominator == 0:
            return 0.0, breakdown
        return numerator / denominator, breakdown

    def _freshness_factor(self, last_update: datetime, now: datetime) -> float:
        # exponential decay with half-life, so old data fades smoothly - precalc vibes
        delta_hours = max(0.0, (now - last_update).total_seconds() / 3600.0)
        lam = math.log(2) / max(0.001, self.config.stale_half_life_hours)
        return math.exp(-lam * delta_hours)

    def _dynamic_weights(self, severity: str, stability: str) -> Tuple[float, float]:
        # more urgent cases push proximity weight up.
        preference = PROXIMITY_PREFERENCE.get((severity.lower(), stability.lower()), 0.3)
        beta = self.config.base_proximity_weight + preference * (1 - self.config.base_proximity_weight)
        alpha = 1 - beta
        return alpha, beta
