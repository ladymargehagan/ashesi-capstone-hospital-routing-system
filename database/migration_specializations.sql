CREATE TABLE IF NOT EXISTS medical_specializations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

INSERT INTO medical_specializations (name) VALUES
    ('General Practice'),
    ('Emergency Medicine'),
    ('Internal Medicine'),
    ('Surgery (General)'),
    ('Cardiology'),
    ('Neurology'),
    ('Paediatrics'),
    ('Obstetrics & Gynaecology'),
    ('Orthopaedics'),
    ('Radiology'),
    ('Anaesthesiology'),
    ('Psychiatry'),
    ('Oncology'),
    ('Nephrology'),
    ('Urology'),
    ('Ophthalmology'),
    ('ENT (Ear, Nose & Throat)'),
    ('Dermatology'),
    ('Gastroenterology'),
    ('Pulmonology')
ON CONFLICT (name) DO NOTHING;
