"""
Seeds received referrals for Dr. Adwoa Attah at La General Hospital.

These are referrals from smaller hospitals (polyclinics, health centres)
sent TO La General, with Dr. Attah assigned as the receiving physician.
Cases are general/internal medicine — appropriate for La General's capability.

Usage:
    cd Backend && python seed_received_referrals.py
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from core.db import db_cursor

ASSIGNED_PHYSICIAN_ID = 17    # Dr. Adwoa Attah
LA_GENERAL_ID         = 209

NOW = datetime.utcnow()

def days_ago(n): return NOW - timedelta(days=n)

# ---------------------------------------------------------------------------
# Referrals FROM smaller hospitals TO La General, assigned to Dr. Attah
# Each entry references an existing patient and referring physician
# ---------------------------------------------------------------------------
RECEIVED_REFERRALS = [
    {
        # From Adabraka Polyclinic — existing patient Charles Owusu
        "patient_id":             63,
        "referring_physician_id": 32,   # Dr. Stephen Addo, Adabraka Polyclinic
        "referring_hospital_id":  16,   # Adabraka Polyclinic
        "referral_reason":        "general",
        "severity":               "medium",
        "stability":              "stable",
        "urgency_level":          "urgent",
        "status":                 "completed",
        "outcome":                "discharged",
        "outcome_notes":          "Patient admitted for 3 days. IV antibiotics started for community-acquired pneumonia. Responded well. Discharged with oral amoxicillin-clavulanate and follow-up in 1 week.",
        "submitted_at":           days_ago(25),
        "approved_at":            days_ago(25),
        "arrived_at":             days_ago(24),
        "completed_at":           days_ago(21),
        "known_allergies":        None,
        "pre_existing_conditions":"Asthma",
        "presenting_complaint":   "Productive cough with fever and right-sided pleuritic chest pain for 5 days. Not improving on oral antibiotics from polyclinic.",
        "clinical_history":       "Asthmatic on salbutamol inhaler. No prior hospital admissions.",
        "examination_findings":   "Febrile 38.8°C. Dull to percussion and reduced air entry at right base. RR 22.",
        "working_diagnosis":      "Community-acquired pneumonia — right lower lobe",
        "investigations_done":    "CXR: right lower zone consolidation. WBC 14.2. CRP 88.",
        "treatment_given":        "Oral co-amoxiclav and azithromycin started at polyclinic. Oxygen 2L/min.",
        "reason_for_referral":    "Patient not responding to oral antibiotics. Requires IV therapy and inpatient monitoring.",
        "vital_signs":            {"temperature": 38.8, "pulse": 102, "respiratory_rate": 22, "blood_pressure_systolic": 118, "blood_pressure_diastolic": 76, "spO2": 94, "gcs": 15},
    },
    {
        # From Dodowa Health Centre — existing patient (create new since none seeded there)
        "patient_id":             None,   # will be created
        "new_patient": {
            "patient_identifier": "DDW-2024-001",
            "full_name":          "Kwesi Nkrumah",
            "first_name":         "Kwesi",
            "last_name":          "Nkrumah",
            "date_of_birth":      "1960-04-08",
            "sex":                "male",
            "nhis_number":        "GHA-99001122",
            "nhis_status":        "Active",
            "contact_number":     "0244556677",
            "address":            "Dodowa, Greater Accra",
            "next_of_kin_name":   "Abena Nkrumah",
            "next_of_kin_contact":"0244778899",
            "physician_id":       42,   # Dr. Kojo Doku, Dodowa Health Centre
        },
        "referring_physician_id": 42,   # Dr. Kojo Doku
        "referring_hospital_id":  132,  # Dodowa Health Centre
        "referral_reason":        "general",
        "severity":               "high",
        "stability":              "stable",
        "urgency_level":          "urgent",
        "status":                 "completed",
        "outcome":                "discharged",
        "outcome_notes":          "Investigations confirmed Type 2 DM with HbA1c of 11.2%. Started on metformin and gliclazide. Diabetic educator reviewed. Discharged after 2 days with follow-up at La General diabetic clinic.",
        "submitted_at":           days_ago(15),
        "approved_at":            days_ago(15),
        "arrived_at":             days_ago(14),
        "completed_at":           days_ago(12),
        "known_allergies":        None,
        "pre_existing_conditions":"Hypertension",
        "presenting_complaint":   "Progressive fatigue, polyuria, polydipsia, and 8kg weight loss over 3 months. Random blood glucose at health centre 24.6 mmol/L.",
        "clinical_history":       "Hypertension on amlodipine. No prior diabetes diagnosis.",
        "examination_findings":   "BMI 31. BP 148/92. No foot ulcers. Mild peripheral neuropathy on monofilament testing.",
        "working_diagnosis":      "New-onset Type 2 Diabetes Mellitus — poorly controlled",
        "investigations_done":    "RBG 24.6 at health centre. Urine dipstick: glucose 3+, ketones trace.",
        "treatment_given":        "IV fluids, insulin sliding scale initiated, electrolytes monitored.",
        "reason_for_referral":    "New diabetes diagnosis requiring inpatient stabilisation, full work-up, and diabetic education. Beyond capacity of health centre.",
        "vital_signs":            {"temperature": 36.8, "pulse": 88, "respiratory_rate": 16, "blood_pressure_systolic": 148, "blood_pressure_diastolic": 92, "spO2": 98, "gcs": 15},
    },
    {
        # From Kaneshie Polyclinic — existing patient
        "patient_id":             None,
        "new_patient": {
            "patient_identifier": "KAN-2024-001",
            "full_name":          "Maame Esi Bonsu",
            "first_name":         "Maame Esi",
            "last_name":          "Bonsu",
            "date_of_birth":      "1975-01-25",
            "sex":                "female",
            "nhis_number":        "GHA-11223344",
            "nhis_status":        "Active",
            "contact_number":     "0201889900",
            "address":            "Kaneshie, Accra",
            "next_of_kin_name":   "Kofi Bonsu",
            "next_of_kin_contact":"0201001122",
            "physician_id":       36,   # Dr. Samuel Kumi, Kaneshie Polyclinic
        },
        "referring_physician_id": 36,   # Dr. Samuel Kumi
        "referring_hospital_id":  196,  # Kaneshie Polyclinic
        "referral_reason":        "general",
        "severity":               "medium",
        "stability":              "stable",
        "urgency_level":          "routine",
        "status":                 "completed",
        "outcome":                "discharged",
        "outcome_notes":          "Upper endoscopy confirmed peptic ulcer disease with H. pylori infection. Triple therapy started (omeprazole, amoxicillin, clarithromycin). Discharged after 1 day with outpatient follow-up.",
        "submitted_at":           days_ago(7),
        "approved_at":            days_ago(7),
        "arrived_at":             days_ago(6),
        "completed_at":           days_ago(5),
        "known_allergies":        "NSAIDs",
        "pre_existing_conditions":"None",
        "presenting_complaint":   "Epigastric pain for 6 weeks, worse after meals. Two episodes of haematemesis in the last 48 hours.",
        "clinical_history":       "No prior GI history. No regular medications. Social drinker.",
        "examination_findings":   "Mild epigastric tenderness. No peritonism. HR 94, BP 110/70. No signs of active bleeding.",
        "working_diagnosis":      "Peptic ulcer disease with upper GI bleed — H. pylori suspected",
        "investigations_done":    "Hb 10.2g/dL. Urea elevated at 12.4. Stool H. pylori antigen: positive.",
        "treatment_given":        "IV omeprazole 40mg BD, IV fluids, nil by mouth, cross-match blood.",
        "reason_for_referral":    "Requires upper endoscopy for diagnosis and haemostasis if active bleeding found. Polyclinic has no endoscopy.",
        "vital_signs":            {"temperature": 36.7, "pulse": 94, "respiratory_rate": 17, "blood_pressure_systolic": 110, "blood_pressure_diastolic": 70, "spO2": 99, "gcs": 15},
    },
    {
        # From Prampram Health Centre — pending referral (still active)
        "patient_id":             None,
        "new_patient": {
            "patient_identifier": "PRM-2024-001",
            "full_name":          "Fiifi Yankson",
            "first_name":         "Fiifi",
            "last_name":          "Yankson",
            "date_of_birth":      "1990-06-19",
            "sex":                "male",
            "nhis_number":        "GHA-55443322",
            "nhis_status":        "None",
            "contact_number":     "0277334455",
            "address":            "Prampram, Greater Accra",
            "next_of_kin_name":   "Ama Yankson",
            "next_of_kin_contact":"0277556677",
            "physician_id":       44,   # Dr. Bright Adjei, Prampram
        },
        "referring_physician_id": 44,   # Dr. Bright Adjei
        "referring_hospital_id":  331,  # Prampram Health Centre
        "referral_reason":        "general",
        "severity":               "medium",
        "stability":              "stable",
        "urgency_level":          "urgent",
        "status":                 "approved",
        "outcome":                None,
        "outcome_notes":          None,
        "submitted_at":           days_ago(1),
        "approved_at":            days_ago(1),
        "arrived_at":             None,
        "completed_at":           None,
        "known_allergies":        None,
        "pre_existing_conditions":"Sickle cell disease (HbSS)",
        "presenting_complaint":   "Severe generalised bone pain, fever, and jaundice over 2 days. Known sickle cell patient in vaso-occlusive crisis.",
        "clinical_history":       "HbSS diagnosed in childhood. Multiple prior admissions for crisis. On folic acid and hydroxyurea.",
        "examination_findings":   "Icteric sclerae. Fever 38.6°C. Tender long bones and back. Spleen not palpable. HR 110.",
        "working_diagnosis":      "Sickle cell vaso-occlusive crisis with possible acute chest syndrome",
        "investigations_done":    "Hb 5.8g/dL. Sickling test positive. WBC 18.2. Bilirubin 64 (indirect predominant).",
        "treatment_given":        "IV fluids, morphine PRN, folic acid, oxygen 4L/min, blood crossmatch sent.",
        "reason_for_referral":    "Patient requires inpatient haematology-level care, possible blood transfusion, and monitoring for acute chest syndrome beyond health centre capacity.",
        "vital_signs":            {"temperature": 38.6, "pulse": 110, "respiratory_rate": 20, "blood_pressure_systolic": 108, "blood_pressure_diastolic": 68, "spO2": 95, "gcs": 15},
    },
]


def seed():
    print("=" * 60)
    print("  Received Referrals Seed — Dr. Adwoa Attah")
    print("=" * 60)

    created_referrals = 0
    created_patients  = 0

    with db_cursor() as cur:
        for ref in RECEIVED_REFERRALS:
            patient_id = ref.get("patient_id")

            # Create new patient if needed
            if patient_id is None and ref.get("new_patient"):
                np = ref["new_patient"]
                cur.execute(
                    "SELECT patient_id FROM patients WHERE patient_identifier = %s",
                    (np["patient_identifier"],),
                )
                existing = cur.fetchone()
                if existing:
                    patient_id = existing["patient_id"]
                    print(f"  Patient '{np['full_name']}' already exists (patient_id={patient_id})")
                else:
                    cur.execute(
                        """
                        INSERT INTO patients
                            (physician_id, patient_identifier, full_name, first_name, last_name,
                             date_of_birth, sex, nhis_number, nhis_status, contact_number,
                             address, next_of_kin_name, next_of_kin_contact)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        RETURNING patient_id
                        """,
                        (
                            np["physician_id"],
                            np["patient_identifier"],
                            np["full_name"],
                            np["first_name"],
                            np["last_name"],
                            np["date_of_birth"],
                            np["sex"],
                            np.get("nhis_number"),
                            np.get("nhis_status", "None"),
                            np.get("contact_number"),
                            np.get("address"),
                            np.get("next_of_kin_name"),
                            np.get("next_of_kin_contact"),
                        ),
                    )
                    patient_id = cur.fetchone()["patient_id"]
                    created_patients += 1
                    print(f"  Created patient '{np['full_name']}' (patient_id={patient_id})")

            # Check if referral already exists
            cur.execute(
                "SELECT referral_id FROM referrals WHERE patient_id = %s AND referring_hospital_id = %s AND submitted_at = %s",
                (patient_id, ref["referring_hospital_id"], ref["submitted_at"]),
            )
            if cur.fetchone():
                print(f"  Referral for patient_id={patient_id} already exists, skipping.")
                continue

            # Insert referral
            cur.execute(
                """
                INSERT INTO referrals
                    (patient_id, referring_physician_id, referring_hospital_id,
                     receiving_hospital_id, assigned_physician_id,
                     severity, stability, referral_reason, urgency_level,
                     known_allergies, pre_existing_conditions,
                     status, submitted_at, approved_at, arrived_at, completed_at,
                     outcome, outcome_notes, outcome_recorded_at,
                     routing_queue, estimated_arrival_minutes)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING referral_id
                """,
                (
                    patient_id,
                    ref["referring_physician_id"],
                    ref["referring_hospital_id"],
                    LA_GENERAL_ID,
                    ASSIGNED_PHYSICIAN_ID,
                    ref["severity"],
                    ref["stability"],
                    ref["referral_reason"],
                    ref["urgency_level"],
                    ref.get("known_allergies"),
                    ref.get("pre_existing_conditions"),
                    ref["status"],
                    ref["submitted_at"],
                    ref.get("approved_at"),
                    ref.get("arrived_at"),
                    ref.get("completed_at"),
                    ref.get("outcome"),
                    ref.get("outcome_notes"),
                    ref.get("completed_at"),
                    json.dumps([]),
                    45,
                ),
            )
            referral_id = cur.fetchone()["referral_id"]

            # Insert referral details
            vs = ref.get("vital_signs")
            cur.execute(
                """
                INSERT INTO referral_details
                    (referral_id, presenting_complaint, clinical_history,
                     examination_findings, working_diagnosis, investigations_done,
                     treatment_given, reason_for_referral, vital_signs)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    referral_id,
                    ref.get("presenting_complaint"),
                    ref.get("clinical_history"),
                    ref.get("examination_findings"),
                    ref.get("working_diagnosis"),
                    ref.get("investigations_done"),
                    ref.get("treatment_given"),
                    ref.get("reason_for_referral"),
                    json.dumps(vs) if vs else None,
                ),
            )
            created_referrals += 1
            status_label = f"{ref['status']} / outcome: {ref.get('outcome') or 'pending'}"
            print(f"    Referral {referral_id} → {ref['referral_reason']} from hospital_id={ref['referring_hospital_id']} [{status_label}]")

    print()
    print("=" * 60)
    print(f"  Done. Created {created_patients} patient(s), {created_referrals} referral(s).")
    print("=" * 60)


if __name__ == "__main__":
    seed()
