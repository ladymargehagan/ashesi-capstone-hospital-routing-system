-- ==========================================================================
-- HRS Database Seed Data
-- ==========================================================================
-- Run this after creating the schema (HRSdb.sql + migration_add_emergency_type.sql)
--
-- Login Credentials:
--   Super Admin:     admin@healthref.com / admin123
--   Hospital Admin:  hospital@general.com / hospital123
--   Physician:       physician@clinic.com / physician123
-- ==========================================================================

-- 1. Roles
INSERT INTO role (role_name, description) VALUES
    ('super_admin', 'System administrator'),
    ('hospital_admin', 'Hospital administrator'),
    ('physician', 'Referring physician')
ON CONFLICT (role_name) DO NOTHING;

-- 2. Hospitals (5 Ghanaian hospitals)
INSERT INTO hospitals (name, license_number, gps_coordinates, address, tier, type, ownership, operating_hours, contact_phone, status)
VALUES
    ('Korle Bu Teaching Hospital', 'HLC-KBTH-001', POINT(5.5600, -0.2057), 'Guggisberg Ave, Accra', 'tier_3', 'teaching', 'public', '24/7', '0302-123-456', 'active'),
    ('37 Military Hospital', 'HLC-37MH-002', POINT(5.5830, -0.1850), 'Liberation Road, Accra', 'tier_3', 'specialist', 'military', '24/7', '0302-654-321', 'active'),
    ('Ridge Regional Hospital', 'HLC-RIDGE-003', POINT(5.5605, -0.1860), 'Castle Road, Accra', 'tier_2', 'regional', 'public', '7:00 - 22:00', '0302-111-222', 'active'),
    ('LEKMA Hospital', 'HLC-LEKMA-004', POINT(5.6030, -0.1300), 'Teshie-Nungua, Accra', 'tier_2', 'district', 'public', '24/7', '0302-333-444', 'active'),
    ('Tema General Hospital', 'HLC-TEMA-005', POINT(5.6690, -0.0166), 'Tema Community 1, Tema', 'tier_2', 'regional', 'public', '24/7', '0303-555-666', 'active')
ON CONFLICT (license_number) DO NOTHING;

-- 3. Users
-- Super Admin: admin@healthref.com / admin123
INSERT INTO users (email, password_hash, role_id, full_name, status)
VALUES (
    'admin@healthref.com',
    '$2b$12$0P2cmugG2OrVRgj6xtzHJuhIWJOKLkQWzcEp1MROQgvaqIniF5nP6',
    (SELECT role_id FROM role WHERE role_name = 'super_admin'),
    'System Administrator',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Hospital Admin: hospital@general.com / hospital123  (assigned to Korle Bu)
INSERT INTO users (email, password_hash, role_id, full_name, hospital_id, status)
VALUES (
    'hospital@general.com',
    '$2b$12$ltOuP34zFWwoUnmjb3.lruk/9mHECCVCX6g4ykm31RdUAKp7OPzdK',
    (SELECT role_id FROM role WHERE role_name = 'hospital_admin'),
    'Hospital Admin - Korle Bu',
    (SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'),
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Hospital Admin for 37 Military
INSERT INTO users (email, password_hash, role_id, full_name, hospital_id, status)
VALUES (
    'admin@37military.com',
    '$2b$12$ltOuP34zFWwoUnmjb3.lruk/9mHECCVCX6g4ykm31RdUAKp7OPzdK',
    (SELECT role_id FROM role WHERE role_name = 'hospital_admin'),
    'Hospital Admin - 37 Military',
    (SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-37MH-002'),
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Physician: physician@clinic.com / physician123  (at Korle Bu)
INSERT INTO users (email, password_hash, role_id, full_name, phone_number, hospital_id, status)
VALUES (
    'physician@clinic.com',
    '$2b$12$TgIpTbeKVNVq599bCSWNAOCJjFNq/4kXxcB53EwWv4pE.mDQP2QB.',
    (SELECT role_id FROM role WHERE role_name = 'physician'),
    'Dr. Michael Brown',
    '+233 24 123 4567',
    (SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'),
    'active'
) ON CONFLICT (email) DO NOTHING;

-- 4. Physician record (links user to physician table)
INSERT INTO physicians (user_id, hospital_id, license_number, specialization, status)
VALUES (
    (SELECT user_id FROM users WHERE email = 'physician@clinic.com'),
    (SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'),
    'MD-12345',
    'General Practice',
    'active'
) ON CONFLICT (user_id) DO NOTHING;

-- 5. Hospital Resources
-- Korle Bu Teaching Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'icu_beds', 10, 2, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'general_beds', 100, 45, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'theatre', 5, 3, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'blood_bank', 1, 1, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'ventilators', 8, 4, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'ct_scan', 2, 1, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'mri', 1, 1, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'lab', 3, 2, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'xray', 2, 2, true);

-- 37 Military Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-37MH-002'), 'icu_beds', 8, 1, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-37MH-002'), 'general_beds', 80, 30, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-37MH-002'), 'theatre', 4, 2, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-37MH-002'), 'blood_bank', 1, 1, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-37MH-002'), 'ventilators', 6, 3, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-37MH-002'), 'ct_scan', 1, 1, true);

-- Ridge Regional Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-RIDGE-003'), 'icu_beds', 5, 0, false),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-RIDGE-003'), 'general_beds', 60, 20, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-RIDGE-003'), 'ventilators', 4, 3, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-RIDGE-003'), 'ct_scan', 1, 1, true);

-- LEKMA Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-LEKMA-004'), 'icu_beds', 3, 1, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-LEKMA-004'), 'general_beds', 40, 15, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-LEKMA-004'), 'ventilators', 2, 2, true);

-- Tema General Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-TEMA-005'), 'icu_beds', 4, 1, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-TEMA-005'), 'general_beds', 50, 25, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-TEMA-005'), 'ct_scan', 1, 1, true);

-- 6. Specialists
-- Korle Bu
INSERT INTO specialists (hospital_id, specialty, specialist_name, on_call_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'Cardiology', 'Dr. Kwame Asante', true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'Trauma Surgery', 'Dr. Ama Mensah', true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'Neurology', 'Dr. Kofi Boateng', false),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'Obstetrics', 'Dr. Abena Osei', true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'), 'Pulmonology', 'Dr. Yaw Darko', true);

-- 37 Military
INSERT INTO specialists (hospital_id, specialty, specialist_name, on_call_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-37MH-002'), 'Cardiology', 'Dr. Samuel Tetteh', true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-37MH-002'), 'Trauma Surgery', 'Dr. Grace Addo', true);

-- Ridge
INSERT INTO specialists (hospital_id, specialty, specialist_name, on_call_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-RIDGE-003'), 'Cardiology', 'Dr. Emmanuel Adom', true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-RIDGE-003'), 'Pulmonology', 'Dr. Mercy Adjei', true);

-- LEKMA
INSERT INTO specialists (hospital_id, specialty, specialist_name, on_call_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-LEKMA-004'), 'Pulmonology', 'Dr. Isaac Owusu', false);

-- Tema
INSERT INTO specialists (hospital_id, specialty, specialist_name, on_call_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-TEMA-005'), 'Cardiology', 'Dr. Peter Ankrah', true);

-- 7. Sample Patients (assigned to the physician)
INSERT INTO patients (physician_id, patient_identifier, full_name, date_of_birth, sex, nhis_number, contact_number, next_of_kin_name, next_of_kin_contact, address, nhis_status)
VALUES
    (
        (SELECT physician_id FROM physicians WHERE license_number = 'MD-12345'),
        'PAT-2026-001',
        'Kwesi Mensah',
        '1985-03-15',
        'male',
        'NHIS-10023456',
        '+233 24 555 1001',
        'Ama Mensah',
        '+233 24 555 1002',
        '14 Oxford Street, Osu, Accra',
        'Active'
    ),
    (
        (SELECT physician_id FROM physicians WHERE license_number = 'MD-12345'),
        'PAT-2026-002',
        'Abena Owusu',
        '1992-07-22',
        'female',
        'NHIS-10034567',
        '+233 20 555 2001',
        'Kofi Owusu',
        '+233 20 555 2002',
        '7 Ring Road East, Accra',
        'Active'
    ),
    (
        (SELECT physician_id FROM physicians WHERE license_number = 'MD-12345'),
        'PAT-2026-003',
        'Yaw Boateng',
        '1970-11-03',
        'male',
        NULL,
        '+233 27 555 3001',
        'Efua Boateng',
        '+233 27 555 3002',
        '22 Cantonments Road, Accra',
        'None'
    )
ON CONFLICT (patient_identifier) DO NOTHING;

-- 8. Sample Referral (from Korle Bu to 37 Military)
INSERT INTO referrals (patient_id, referring_physician_id, referring_hospital_id, receiving_hospital_id, status, severity, stability, emergency_type)
VALUES (
    (SELECT patient_id FROM patients WHERE patient_identifier = 'PAT-2026-001'),
    (SELECT physician_id FROM physicians WHERE license_number = 'MD-12345'),
    (SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-KBTH-001'),
    (SELECT hospital_id FROM hospitals WHERE license_number = 'HLC-37MH-002'),
    'pending',
    'high',
    'stable',
    'cardiac'
) ON CONFLICT DO NOTHING;

-- Referral details
INSERT INTO referral_details (referral_id, presenting_complaint, clinical_history, initial_diagnosis, current_condition, reason_for_referral, treatment_given)
VALUES (
    (SELECT referral_id FROM referrals ORDER BY referral_id DESC LIMIT 1),
    'Chest pain radiating to left arm, onset 2 hours ago',
    'No previous cardiac history. HTN controlled with medication for 5 years.',
    'Acute Coronary Syndrome',
    'Vitals stable. BP 140/90, HR 88, O2 Sat 96%',
    'Requires specialist cardiac evaluation and possible catheterization',
    'Aspirin 300mg, Sublingual GTN, IV access established'
);

-- 9. Sample Notifications
INSERT INTO notifications (user_id, message, type, is_read, read_at) VALUES
    ((SELECT user_id FROM users WHERE email = 'admin@healthref.com'), 'New hospital registration request pending review.', 'hospital_approval', false, NULL),
    ((SELECT user_id FROM users WHERE email = 'hospital@general.com'), 'New referral received for patient Kwesi Mensah.', 'referral_approved', false, NULL),
    ((SELECT user_id FROM users WHERE email = 'physician@clinic.com'), 'Your referral for Kwesi Mensah has been submitted.', 'referral_approved', true, NOW());

-- ==========================================================================
-- Done! Login credentials:
--   Super Admin:     admin@healthref.com / admin123
--   Hospital Admin:  hospital@general.com / hospital123
--   Physician:       physician@clinic.com / physician123
-- ==========================================================================
