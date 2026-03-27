-- ==========================================================================
-- Hospital Resources Seed
-- Run AFTER seed_data_v2.sql.
--
-- This gives the routing engine enough data to return a genuine top-5.
-- Without resource rows, hospitals have no capabilities and get filtered out.
--
-- Tier strategy:
--   Teaching hospitals   → full suite (ICU, stroke, monitored beds, theatre…)
--   Regional hospitals   → mid-tier (emergency beds, ICU, theatre, blood bank)
--   Key private/district → basic (emergency beds, general beds, lab)
--   Polyclinics          → lightest (general beds, lab)
-- ==========================================================================


-- ── Helper: clear existing resource rows so this script is re-runnable ──
DELETE FROM hospital_resources
WHERE hospital_id IN (
    SELECT hospital_id FROM hospitals
    WHERE license_number IN (
        'GHS-GAR-0001','GHS-GAR-0002','GHS-GAR-0003','GHS-GAR-0004',
        'GHS-GAR-0005','GHS-GAR-0006','GHS-GAR-0007',
        'GHS-GAR-0011','GHS-GAR-0012','GHS-GAR-0026','GHS-GAR-0031',
        'GHS-GAR-0047','GHS-GAR-0057','GHS-GAR-0063','GHS-GAR-0066',
        'GHS-GAR-0070','GHS-GAR-0079','GHS-GAR-0090','GHS-GAR-0091',
        'GHS-GAR-0100','GHS-GAR-0101','GHS-GAR-0104','GHS-GAR-0106'
    )
);


-- ==========================================================================
-- 1. TEACHING HOSPITALS  — full capability suite
-- ==========================================================================

-- 37 Military Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'icu_beds',       12, 4,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'emergency_beds', 20, 14, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'monitored_beds', 10, 6,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'stroke_beds',    6,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'general_beds',   80, 40, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'theatre',        6,  3,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'blood_bank',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'ct_scan',        2,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'mri',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'ventilators',    8,  5,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'oxygen_beds',    15, 10, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0001'), 'xray',           2,  2,  true);

-- Korle-Bu Teaching Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'icu_beds',       30, 8,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'emergency_beds', 50, 25, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'stroke_beds',    12, 5,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'monitored_beds', 20, 10, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'maternity_beds', 40, 20, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'general_beds',   300,150, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'theatre',        10, 6,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'blood_bank',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'ct_scan',        3,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'mri',            2,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'ventilators',    20, 12, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'oxygen_beds',    40, 25, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'dialysis',       10, 6,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'xray',           4,  4,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0002'), 'ultrasound',     5,  4,  true);

-- Ridge Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'icu_beds',       10, 3,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'emergency_beds', 25, 12, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'stroke_beds',    6,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'monitored_beds', 8,  5,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'maternity_beds', 20, 12, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'general_beds',   120,70, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'theatre',        4,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'blood_bank',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'ct_scan',        1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'ventilators',    6,  4,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'oxygen_beds',    15, 8,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'xray',           2,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0003'), 'ultrasound',     2,  2,  true);

-- University Hospital (Legon)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'icu_beds',       8,  3,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'emergency_beds', 20, 10, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'stroke_beds',    4,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'monitored_beds', 6,  4,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'general_beds',   100,55, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'theatre',        3,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'blood_bank',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'ct_scan',        1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'ventilators',    5,  3,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'oxygen_beds',    10, 6,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0004'), 'xray',           2,  2,  true);


-- ==========================================================================
-- 2. REGIONAL / LARGE DISTRICT HOSPITALS  — mid-tier
-- ==========================================================================

-- La General Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0005'), 'emergency_beds', 15, 8,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0005'), 'icu_beds',       4,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0005'), 'general_beds',   60, 30, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0005'), 'maternity_beds', 10, 6,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0005'), 'theatre',        2,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0005'), 'blood_bank',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0005'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0005'), 'xray',           1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0005'), 'oxygen_beds',    8,  5,  true);

-- Tema General Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0006'), 'emergency_beds', 20, 10, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0006'), 'icu_beds',       6,  3,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0006'), 'stroke_beds',    3,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0006'), 'general_beds',   80, 40, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0006'), 'maternity_beds', 15, 8,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0006'), 'theatre',        3,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0006'), 'blood_bank',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0006'), 'ct_scan',        1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0006'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0006'), 'xray',           2,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0006'), 'oxygen_beds',    10, 6,  true);

-- Achimota Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0007'), 'emergency_beds', 12, 6,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0007'), 'icu_beds',       4,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0007'), 'general_beds',   50, 28, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0007'), 'theatre',        2,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0007'), 'blood_bank',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0007'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0007'), 'xray',           1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0007'), 'oxygen_beds',    6,  4,  true);


-- ==========================================================================
-- 3. KEY PRIVATE / SPECIALIST DISTRICT HOSPITALS  — basic to mid-tier
-- ==========================================================================

-- Police Hospital
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0011'), 'emergency_beds', 10, 5,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0011'), 'general_beds',   40, 20, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0011'), 'icu_beds',       3,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0011'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0011'), 'xray',           1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0011'), 'theatre',        1,  1,  true);

-- Trust Hospital (SSNIT Hospital)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0012'), 'emergency_beds', 12, 6,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0012'), 'general_beds',   50, 25, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0012'), 'icu_beds',       4,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0012'), 'monitored_beds', 4,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0012'), 'theatre',        2,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0012'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0012'), 'ultrasound',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0012'), 'oxygen_beds',    6,  4,  true);

-- Clecom Memorial Specialist Hospital (Dzorwulu)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0026'), 'emergency_beds', 8,  4,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0026'), 'general_beds',   30, 15, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0026'), 'icu_beds',       3,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0026'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0026'), 'ultrasound',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0026'), 'xray',           1,  1,  true);

-- Eden Specialist Hospital (North Kaneshie)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0031'), 'emergency_beds', 8,  5,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0031'), 'general_beds',   25, 12, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0031'), 'maternity_beds', 6,  3,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0031'), 'theatre',        1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0031'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0031'), 'ultrasound',     1,  1,  true);

-- Jubail Specialist Hospital (Sakumono / Tema area)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0047'), 'emergency_beds', 10, 5,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0047'), 'general_beds',   35, 18, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0047'), 'icu_beds',       3,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0047'), 'theatre',        1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0047'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0047'), 'xray',           1,  1,  true);

-- Medifem Hospital (Dzorwulu — women's health focus)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0057'), 'emergency_beds', 6,  3,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0057'), 'maternity_beds', 15, 8,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0057'), 'general_beds',   20, 10, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0057'), 'theatre',        2,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0057'), 'ultrasound',     2,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0057'), 'lab',            1,  1,  true);

-- Narh Bita Hospital (Tema Community 4)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0063'), 'emergency_beds', 10, 5,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0063'), 'general_beds',   40, 20, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0063'), 'icu_beds',       3,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0063'), 'theatre',        2,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0063'), 'blood_bank',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0063'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0063'), 'xray',           1,  1,  true);

-- North Legon Hospital (Ga East)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0066'), 'emergency_beds', 8,  4,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0066'), 'general_beds',   30, 15, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0066'), 'icu_beds',       2,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0066'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0066'), 'xray',           1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0066'), 'ultrasound',     1,  1,  true);

-- Provita Specialist Hospital (Tema Community 6)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0070'), 'emergency_beds', 8,  4,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0070'), 'general_beds',   30, 15, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0070'), 'icu_beds',       3,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0070'), 'theatre',        1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0070'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0070'), 'xray',           1,  1,  true);

-- St Nicholas Hospital (Tema Community 5)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0079'), 'emergency_beds', 10, 6,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0079'), 'general_beds',   35, 18, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0079'), 'icu_beds',       3,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0079'), 'theatre',        1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0079'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0079'), 'xray',           1,  1,  true);

-- Nyaho Medical Centre (Airport Residential)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0090'), 'emergency_beds', 8,  5,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0090'), 'general_beds',   25, 12, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0090'), 'icu_beds',       4,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0090'), 'monitored_beds', 4,  3,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0090'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0090'), 'ultrasound',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0090'), 'xray',           1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0090'), 'oxygen_beds',    6,  4,  true);

-- Lister Hospital (Airport)
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0091'), 'emergency_beds', 10, 5,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0091'), 'general_beds',   30, 15, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0091'), 'icu_beds',       4,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0091'), 'monitored_beds', 4,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0091'), 'theatre',        2,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0091'), 'lab',            1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0091'), 'ultrasound',     1,  1,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0091'), 'xray',           2,  2,  true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0091'), 'oxygen_beds',    6,  4,  true);


-- ==========================================================================
-- 4. POLYCLINICS  — general + lab only (can handle non-emergency general cases)
-- ==========================================================================

-- Adabraka Polyclinic
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0100'), 'general_beds', 15, 8, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0100'), 'emergency_beds',6, 3, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0100'), 'lab',           1, 1, true);

-- Kaneshie Polyclinic
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0101'), 'general_beds', 15, 7, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0101'), 'emergency_beds',6, 4, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0101'), 'lab',           1, 1, true);

-- Maamobi Polyclinic
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0104'), 'general_beds', 12, 6, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0104'), 'emergency_beds',5, 3, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0104'), 'lab',           1, 1, true);

-- Tema Polyclinic
INSERT INTO hospital_resources (hospital_id, resource_type, total_count, available_count, is_available) VALUES
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0106'), 'general_beds', 15, 8, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0106'), 'emergency_beds',6, 3, true),
    ((SELECT hospital_id FROM hospitals WHERE license_number = 'GHS-GAR-0106'), 'lab',           1, 1, true);


-- Done. Check results with:
-- SELECT h.name, COUNT(r.resource_id) as resources
-- FROM hospitals h
-- LEFT JOIN hospital_resources r ON h.hospital_id = r.hospital_id
-- GROUP BY h.name
-- HAVING COUNT(r.resource_id) > 0
-- ORDER BY resources DESC;
SELECT 'Resources seeded for ' ||
    (SELECT COUNT(DISTINCT hospital_id) FROM hospital_resources) ||
    ' hospitals, ' ||
    (SELECT COUNT(*) FROM hospital_resources) ||
    ' total resource rows.' AS result;
