"""
Seed script for Dr. Adwoa Attah at La General Hospital.

Creates 8 patients with realistic Ghanaian profiles and completed
referral history with varying outcomes (discharged, transferred_again,
deceased, ongoing). The patients skew cardiac/internal medicine since
Dr. Attah is an internist at a hospital with no ICU or monitored beds.

La General Hospital (id=209) — no icu_beds, no monitored_beds, no ct_scan.
Cardiac-capable receiving hospitals:
  - Korle-Bu Teaching Hospital (id=205)
  - University of Ghana Medical Centre (id=419)
  - 37 Military Hospital (id=4)
  - Ridge Hospital (id=357)
  - Tema General Hospital (id=399)

Usage:
    cd Backend && python seed_la_general.py
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

# ---------------------------------------------------------------------------
# Known IDs
# ---------------------------------------------------------------------------
PHYSICIAN_ID   = 17      # Dr. Adwoa Attah — Internal Medicine
HOSPITAL_ID    = 209     # La General Hospital (no ICU, no monitored beds)
LA_GENERAL_ID  = 209

RECEIVING = {
    "korle_bu": 205,
    "ugmc":     419,
    "military": 4,
    "ridge":    357,
    "tema":     399,
}

NOW = datetime.utcnow()


def days_ago(n: int) -> datetime:
    return NOW - timedelta(days=n)


# ---------------------------------------------------------------------------
# Patient definitions
# ---------------------------------------------------------------------------
PATIENTS = [
    {
        "patient_identifier": "LGH-2024-001",
        "full_name": "Kofi Mensah",
        "first_name": "Kofi",
        "last_name": "Mensah",
        "date_of_birth": "1978-03-15",
        "sex": "male",
        "nhis_number": "GHA-12345678",
        "nhis_status": "Active",
        "contact_number": "0244123456",
        "address": "Madina, Accra",
        "next_of_kin_name": "Abena Mensah",
        "next_of_kin_contact": "0244987654",
        # Demo patient — NO referral seeded (used live during demo)
        "referrals": [],
    },
    {
        "patient_identifier": "LGH-2024-002",
        "full_name": "Akua Boateng",
        "first_name": "Akua",
        "last_name": "Boateng",
        "date_of_birth": "1965-07-22",
        "sex": "female",
        "nhis_number": "GHA-22334455",
        "nhis_status": "Active",
        "contact_number": "0201456789",
        "address": "Teshie, Accra",
        "next_of_kin_name": "Kweku Boateng",
        "next_of_kin_contact": "0201789012",
        "referrals": [
            {
                "receiving_hospital_id": RECEIVING["korle_bu"],
                "referral_reason": "cardiac",
                "severity": "critical",
                "stability": "unstable",
                "urgency_level": "emergency",
                "status": "completed",
                "outcome": "discharged",
                "outcome_notes": "Patient underwent successful angioplasty at Korle Bu. Discharged after 6 days with dual antiplatelet therapy and cardiac rehab referral.",
                "submitted_at": days_ago(45),
                "approved_at": days_ago(44),
                "arrived_at": days_ago(44),
                "completed_at": days_ago(39),
                "known_allergies": "Penicillin",
                "pre_existing_conditions": "Hypertension, Type 2 Diabetes",
                "presenting_complaint": "Severe central chest pain radiating to left arm, onset 3 hours prior. Diaphoresis and nausea.",
                "clinical_history": "Known hypertensive and diabetic on amlodipine and metformin. No prior cardiac history.",
                "examination_findings": "Pale, diaphoretic. BP 85/55. Pulse 118, irregular. JVP elevated. Bilateral basal crepitations.",
                "working_diagnosis": "Acute STEMI — inferior MI",
                "investigations_done": "12-lead ECG: ST elevation in leads II, III, aVF. Troponin I elevated at 2.4 ng/mL.",
                "treatment_given": "Aspirin 300mg, clopidogrel 600mg, sublingual GTN, IV morphine 5mg, oxygen 4L/min.",
                "reason_for_referral": "Patient requires urgent primary PCI. La General has no catheterisation lab or cardiac ICU.",
                "vital_signs": {"temperature": 37.1, "pulse": 118, "respiratory_rate": 26, "blood_pressure_systolic": 85, "blood_pressure_diastolic": 55, "spO2": 91, "gcs": 14},
            }
        ],
    },
    {
        "patient_identifier": "LGH-2024-003",
        "full_name": "Yaw Darko",
        "first_name": "Yaw",
        "last_name": "Darko",
        "date_of_birth": "1952-11-04",
        "sex": "male",
        "nhis_number": "GHA-33445566",
        "nhis_status": "Active",
        "contact_number": "0277345678",
        "address": "Osu, Accra",
        "next_of_kin_name": "Ama Darko",
        "next_of_kin_contact": "0277901234",
        "referrals": [
            {
                "receiving_hospital_id": RECEIVING["ugmc"],
                "referral_reason": "stroke",
                "severity": "critical",
                "stability": "unstable",
                "urgency_level": "emergency",
                "status": "completed",
                "outcome": "deceased",
                "outcome_notes": "Patient arrived 4 hours after symptom onset. CT confirmed large left MCA territory infarct. Thrombolysis contraindicated. Patient deteriorated rapidly and died on day 3.",
                "submitted_at": days_ago(90),
                "approved_at": days_ago(90),
                "arrived_at": days_ago(90),
                "completed_at": days_ago(87),
                "known_allergies": None,
                "pre_existing_conditions": "Atrial fibrillation, Hypertension",
                "presenting_complaint": "Sudden onset right-sided weakness and aphasia. Found by family on the floor at home.",
                "clinical_history": "Known AF on warfarin (INR subtherapeutic). Hypertensive for 10 years.",
                "examination_findings": "GCS 9. Right hemiplegia. NIHSS score 22. BP 195/110.",
                "working_diagnosis": "Acute ischaemic stroke — left MCA territory",
                "investigations_done": "CT brain (plain): hyperdense left MCA sign. Blood glucose 8.2. INR 1.3.",
                "treatment_given": "IV labetalol for BP, oxygen, glucose monitoring, aspiration precautions. Warfarin withheld.",
                "reason_for_referral": "Patient requires CT angiography, stroke unit admission, and neurology input. La General has no CT scanner or stroke beds.",
                "vital_signs": {"temperature": 37.8, "pulse": 88, "respiratory_rate": 20, "blood_pressure_systolic": 195, "blood_pressure_diastolic": 110, "spO2": 94, "gcs": 9},
            }
        ],
    },
    {
        "patient_identifier": "LGH-2024-004",
        "full_name": "Efua Asante",
        "first_name": "Efua",
        "last_name": "Asante",
        "date_of_birth": "1989-05-30",
        "sex": "female",
        "nhis_number": "GHA-44556677",
        "nhis_status": "Active",
        "contact_number": "0244678901",
        "address": "East Legon, Accra",
        "next_of_kin_name": "Kwame Asante",
        "next_of_kin_contact": "0244112233",
        "referrals": [
            {
                "receiving_hospital_id": RECEIVING["ridge"],
                "referral_reason": "obstetric",
                "severity": "high",
                "stability": "stable",
                "urgency_level": "urgent",
                "status": "completed",
                "outcome": "discharged",
                "outcome_notes": "Emergency caesarean section performed at Ridge Hospital. Healthy baby girl delivered at 36 weeks. Mother and infant discharged on day 4 in good condition.",
                "submitted_at": days_ago(30),
                "approved_at": days_ago(30),
                "arrived_at": days_ago(29),
                "completed_at": days_ago(25),
                "known_allergies": None,
                "pre_existing_conditions": "Gestational hypertension",
                "presenting_complaint": "36-week primigravida presenting with severe headache, visual disturbance, and upper abdominal pain. BP 165/110 on arrival.",
                "clinical_history": "Gestational hypertension diagnosed at 32 weeks, on labetalol. Regular antenatal follow-up.",
                "examination_findings": "BP 165/110. Pitting oedema +++. Epigastric tenderness. CTG: late decelerations. Proteinuria 3+.",
                "working_diagnosis": "Severe pre-eclampsia with fetal distress",
                "investigations_done": "Urine dipstick: protein 3+. FBC: platelets 98,000. LFTs: raised AST/ALT. CTG: non-reassuring.",
                "treatment_given": "IV magnesium sulphate loading dose, IV hydralazine for BP control, corticosteroids for fetal lung maturity, IV access secured.",
                "reason_for_referral": "Patient requires emergency LSCS. La General maternity theatre is occupied with an ongoing case and the neonatal unit is at capacity.",
                "vital_signs": {"temperature": 37.2, "pulse": 96, "respiratory_rate": 18, "blood_pressure_systolic": 165, "blood_pressure_diastolic": 110, "spO2": 98, "gcs": 15},
            }
        ],
    },
    {
        "patient_identifier": "LGH-2024-005",
        "full_name": "Kwabena Ofori",
        "first_name": "Kwabena",
        "last_name": "Ofori",
        "date_of_birth": "1970-09-12",
        "sex": "male",
        "nhis_number": "GHA-55667788",
        "nhis_status": "Expired",
        "contact_number": "0208456789",
        "address": "Tema Community 5, Tema",
        "next_of_kin_name": "Adwoa Ofori",
        "next_of_kin_contact": "0208789456",
        "referrals": [
            {
                "receiving_hospital_id": RECEIVING["tema"],
                "referral_reason": "respiratory",
                "severity": "high",
                "stability": "unstable",
                "urgency_level": "emergency",
                "status": "completed",
                "outcome": "transferred_again",
                "outcome_notes": "Patient stabilised at Tema General but required ventilator support not available there. Transferred again to UGMC ICU where he was mechanically ventilated for 8 days. Eventually weaned and discharged after 3 weeks.",
                "submitted_at": days_ago(60),
                "approved_at": days_ago(60),
                "arrived_at": days_ago(60),
                "completed_at": days_ago(38),
                "known_allergies": "Sulfonamides",
                "pre_existing_conditions": "COPD, 30-pack-year smoking history",
                "presenting_complaint": "Progressive shortness of breath over 3 days, now at rest. Productive cough with green sputum. Unable to complete sentences.",
                "clinical_history": "COPD diagnosed 5 years ago. Multiple hospital admissions. Currently on salbutamol and beclomethasone inhalers.",
                "examination_findings": "Severe respiratory distress. Using accessory muscles. RR 36. Wheeze bilaterally. SpO2 78% on 4L oxygen.",
                "working_diagnosis": "Acute exacerbation of COPD with type 2 respiratory failure",
                "investigations_done": "ABG: pH 7.26, pCO2 72, pO2 52 on 4L O2. CXR: hyperinflation, right lower zone consolidation. WBC 18.4.",
                "treatment_given": "Controlled oxygen 28% via Venturi mask, salbutamol and ipratropium nebulisers, IV hydrocortisone, IV co-amoxiclav, IV aminophylline.",
                "reason_for_referral": "Patient requires ICU admission and likely non-invasive or invasive ventilation. La General has no ventilators or ICU.",
                "vital_signs": {"temperature": 38.4, "pulse": 122, "respiratory_rate": 36, "blood_pressure_systolic": 100, "blood_pressure_diastolic": 68, "spO2": 78, "gcs": 13},
            }
        ],
    },
    {
        "patient_identifier": "LGH-2024-006",
        "full_name": "Abena Quaye",
        "first_name": "Abena",
        "last_name": "Quaye",
        "date_of_birth": "1945-02-18",
        "sex": "female",
        "nhis_number": "GHA-66778899",
        "nhis_status": "Active",
        "contact_number": "0302456789",
        "address": "Adenta, Accra",
        "next_of_kin_name": "Kofi Quaye",
        "next_of_kin_contact": "0244334455",
        "referrals": [
            {
                "receiving_hospital_id": RECEIVING["military"],
                "referral_reason": "cardiac",
                "severity": "high",
                "stability": "stable",
                "urgency_level": "urgent",
                "status": "completed",
                "outcome": "discharged",
                "outcome_notes": "Patient admitted for 5 days. Echocardiogram confirmed severe aortic stenosis. Managed medically and referred to cardiac surgery clinic. Discharged with follow-up plan.",
                "submitted_at": days_ago(20),
                "approved_at": days_ago(20),
                "arrived_at": days_ago(19),
                "completed_at": days_ago(14),
                "known_allergies": None,
                "pre_existing_conditions": "Hypertension, hyperlipidaemia",
                "presenting_complaint": "Exertional chest pain and dyspnoea on minimal exertion for 4 weeks. Two episodes of near-syncope on stairs.",
                "clinical_history": "Hypertension and hyperlipidaemia for 15 years. No prior cardiac investigations.",
                "examination_findings": "Ejection systolic murmur grade 4/6 at aortic area radiating to carotids. Slow rising pulse. BP 135/85.",
                "working_diagnosis": "Symptomatic aortic stenosis — possible severe",
                "investigations_done": "ECG: LVH with strain. CXR: cardiomegaly, calcified aortic knuckle. No echocardiogram available at La General.",
                "treatment_given": "Bisoprolol 2.5mg, furosemide 40mg, O2 2L/min, aspirin 75mg.",
                "reason_for_referral": "Patient requires urgent echocardiogram and cardiology review. La General has no echo or cardiology specialist.",
                "vital_signs": {"temperature": 36.9, "pulse": 62, "respiratory_rate": 18, "blood_pressure_systolic": 135, "blood_pressure_diastolic": 85, "spO2": 96, "gcs": 15},
            }
        ],
    },
    {
        "patient_identifier": "LGH-2024-007",
        "full_name": "Nana Kweku Tetteh",
        "first_name": "Nana Kweku",
        "last_name": "Tetteh",
        "date_of_birth": "1983-12-01",
        "sex": "male",
        "nhis_number": "GHA-77889900",
        "nhis_status": "None",
        "contact_number": "0277889900",
        "address": "Achimota, Accra",
        "next_of_kin_name": "Afia Tetteh",
        "next_of_kin_contact": "0277001122",
        "referrals": [
            {
                "receiving_hospital_id": RECEIVING["korle_bu"],
                "referral_reason": "trauma",
                "severity": "critical",
                "stability": "unstable",
                "urgency_level": "emergency",
                "status": "completed",
                "outcome": "discharged",
                "outcome_notes": "Emergency laparotomy performed for splenic laceration and liver contusion. ICU admission for 4 days post-op. Discharged after 12 days.",
                "submitted_at": days_ago(55),
                "approved_at": days_ago(55),
                "arrived_at": days_ago(55),
                "completed_at": days_ago(43),
                "known_allergies": None,
                "pre_existing_conditions": None,
                "presenting_complaint": "RTA victim. Brought in by police. Blunt abdominal trauma, hypotensive, abdomen rigid.",
                "clinical_history": "No known medical history. Unrestrained driver in head-on collision.",
                "examination_findings": "GCS 11. HR 135, BP 70/40. Abdomen rigid with guarding and rebound. FAST positive — free fluid in Morrison's pouch and splenorenal space.",
                "working_diagnosis": "Intra-abdominal haemorrhage — likely splenic laceration",
                "investigations_done": "FAST ultrasound: positive. Hb 6.2g/dL. Crossmatch sent. CXR: no pneumothorax.",
                "treatment_given": "2 large-bore IV lines. 1L normal saline rapid infusion. 2 units O-negative blood. Foley catheter. Morphine 5mg IV.",
                "reason_for_referral": "Patient requires emergency laparotomy. La General theatre is occupied and no surgical ICU available.",
                "vital_signs": {"temperature": 36.2, "pulse": 135, "respiratory_rate": 28, "blood_pressure_systolic": 70, "blood_pressure_diastolic": 40, "spO2": 94, "gcs": 11},
            }
        ],
    },
    {
        "patient_identifier": "LGH-2024-008",
        "full_name": "Ama Serwaa Frimpong",
        "first_name": "Ama Serwaa",
        "last_name": "Frimpong",
        "date_of_birth": "1998-08-14",
        "sex": "female",
        "nhis_number": "GHA-88990011",
        "nhis_status": "Active",
        "contact_number": "0544123456",
        "address": "Kasoa, Central Region",
        "next_of_kin_name": "Kwame Frimpong",
        "next_of_kin_contact": "0244567890",
        "referrals": [
            {
                "receiving_hospital_id": RECEIVING["ugmc"],
                "referral_reason": "seizure",
                "severity": "medium",
                "stability": "stable",
                "urgency_level": "urgent",
                "status": "completed",
                "outcome": "discharged",
                "outcome_notes": "EEG confirmed generalised epilepsy. Started on sodium valproate. Neurology outpatient follow-up arranged. Discharged after 2 days.",
                "submitted_at": days_ago(10),
                "approved_at": days_ago(10),
                "arrived_at": days_ago(9),
                "completed_at": days_ago(7),
                "known_allergies": None,
                "pre_existing_conditions": "No known medical history",
                "presenting_complaint": "First unprovoked generalised tonic-clonic seizure lasting 4 minutes. Post-ictal confusion for 30 minutes.",
                "clinical_history": "No prior seizures. No family history of epilepsy. No recent illness or fever. Not on any medications.",
                "examination_findings": "Post-ictal. GCS now 15. No focal neurology. Tongue laceration. Mild headache.",
                "working_diagnosis": "First seizure — query generalised epilepsy vs symptomatic cause",
                "investigations_done": "Blood glucose: 5.1. Sodium 138, potassium 4.1. FBC normal. CT head: no acute findings.",
                "treatment_given": "IV lorazepam 2mg (given during seizure by ambulance crew). Oxygen 2L/min. IV access maintained.",
                "reason_for_referral": "Patient requires EEG and neurology review for new-onset seizure. La General has no EEG machine or neurology specialist.",
                "vital_signs": {"temperature": 37.0, "pulse": 88, "respiratory_rate": 16, "blood_pressure_systolic": 118, "blood_pressure_diastolic": 74, "spO2": 99, "gcs": 15},
            }
        ],
    },
]


def seed():
    print("=" * 60)
    print("  La General Hospital — Patient & Referral Seed")
    print("=" * 60)
    print(f"  Physician: Dr. Adwoa Attah (physician_id={PHYSICIAN_ID})")
    print(f"  Hospital:  La General Hospital (hospital_id={HOSPITAL_ID})")
    print()

    created_patients = 0
    created_referrals = 0

    with db_cursor() as cur:
        for p in PATIENTS:
            # Check if patient already exists
            cur.execute(
                "SELECT patient_id FROM patients WHERE patient_identifier = %s",
                (p["patient_identifier"],),
            )
            existing = cur.fetchone()

            if existing:
                patient_id = existing["patient_id"]
                print(f"  Patient '{p['full_name']}' already exists (patient_id={patient_id}), skipping insert.")
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
                        PHYSICIAN_ID,
                        p["patient_identifier"],
                        p["full_name"],
                        p["first_name"],
                        p["last_name"],
                        p["date_of_birth"],
                        p["sex"],
                        p.get("nhis_number"),
                        p.get("nhis_status", "None"),
                        p.get("contact_number"),
                        p.get("address"),
                        p.get("next_of_kin_name"),
                        p.get("next_of_kin_contact"),
                    ),
                )
                patient_id = cur.fetchone()["patient_id"]
                created_patients += 1
                print(f"  Created patient '{p['full_name']}' (patient_id={patient_id})")

            # Seed referrals for this patient
            for ref in p.get("referrals", []):
                # Check if referral already exists for this patient at same submitted_at
                cur.execute(
                    "SELECT referral_id FROM referrals WHERE patient_id = %s AND referring_hospital_id = %s AND submitted_at = %s",
                    (patient_id, HOSPITAL_ID, ref["submitted_at"]),
                )
                if cur.fetchone():
                    print(f"    Referral for '{p['full_name']}' already exists, skipping.")
                    continue

                # Determine status timestamps
                approved_at   = ref.get("approved_at")
                arrived_at    = ref.get("arrived_at")
                completed_at  = ref.get("completed_at")
                outcome       = ref.get("outcome")
                status        = ref["status"]

                cur.execute(
                    """
                    INSERT INTO referrals
                        (patient_id, referring_physician_id, referring_hospital_id,
                         receiving_hospital_id, severity, stability, referral_reason,
                         urgency_level, known_allergies, pre_existing_conditions,
                         status, submitted_at, approved_at, arrived_at, completed_at,
                         outcome, outcome_notes, outcome_recorded_at,
                         routing_queue, estimated_arrival_minutes)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    RETURNING referral_id
                    """,
                    (
                        patient_id,
                        PHYSICIAN_ID,
                        HOSPITAL_ID,
                        ref["receiving_hospital_id"],
                        ref["severity"],
                        ref["stability"],
                        ref["referral_reason"],
                        ref["urgency_level"],
                        ref.get("known_allergies"),
                        ref.get("pre_existing_conditions"),
                        status,
                        ref["submitted_at"],
                        approved_at,
                        arrived_at,
                        completed_at,
                        outcome,
                        ref.get("outcome_notes"),
                        completed_at,
                        json.dumps([]),
                        30,
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
                print(f"    Referral {referral_id} → {ref['referral_reason']} → outcome: {outcome or 'N/A'} [{status}]")

    print()
    print("=" * 60)
    print(f"  Done. Created {created_patients} patient(s), {created_referrals} referral(s).")
    print("=" * 60)
    print()
    print("  DEMO ACCOUNT")
    print("  ─────────────────────────────────────────")
    print("  Name:       Dr. Adwoa Attah")
    print("  Role:       Physician — Internal Medicine")
    print("  Hospital:   La General Hospital")
    print("  Email:      adwoa.attah@hrs.med.gh")
    print("  Password:   0hw@tj#SJSTE%@")
    print("  ─────────────────────────────────────────")
    print("  Demo patient for live referral:")
    print("  Name:       Kofi Mensah")
    print("  ID:         LGH-2024-001")
    print("  DOB:        15 March 1978 (47 M)")
    print("  Address:    Madina, Accra")
    print("  NHIS:       GHA-12345678 (Active)")
    print("  Contact:    0244123456")
    print()
    print("  Cardiac-capable receiving hospitals:")
    print("  - Korle-Bu Teaching Hospital (id=205)")
    print("  - University of Ghana Medical Centre (id=419)")
    print("  - 37 Military Hospital (id=4)")
    print("  - Ridge Hospital (id=357)")
    print("  - Tema General Hospital (id=399)")
    print("=" * 60)


if __name__ == "__main__":
    seed()
