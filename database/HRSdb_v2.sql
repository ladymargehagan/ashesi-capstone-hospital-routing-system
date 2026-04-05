-- ==========================================================================
-- HRS Database Schema v2
-- ==========================================================================
-- Changes from v1:
--   - Hospitals are pre-loaded (no dynamic registration)
--   - HOSPITALS 'level' field (teaching/regional/district/polyclinic/health_centre/chps)
--   - USERS stores first_name + last_name separately; full_name is generated
--   - USERS has auth_uid for Supabase Auth integration
--   - PATIENTS adds hospital_id (decoupled from single physician ownership)
--   - PHYSICIANS adds department, specialty, title, grade, availability
--   - NEW: REFERRAL_ATTACHMENTS table for file uploads
--   - NEW: TRANSIT_UPDATES table for live condition tracking
--   - NEW: HOSPITAL_DATA_FLAGS for physician-reported data issues
--   - NEW: ADMIN_INVITES for hospital admin onboarding
--   - NOTIFICATIONS adds email_sent tracking
-- ==========================================================================

-- 0. Drop existing tables (in dependency order)
DROP TABLE IF EXISTS AUDIT_LOGS CASCADE;
DROP TABLE IF EXISTS ADMIN_INVITES CASCADE;
DROP TABLE IF EXISTS HOSPITAL_DATA_FLAGS CASCADE;
DROP TABLE IF EXISTS PASSWORD_RESETS CASCADE;
DROP TABLE IF EXISTS NOTIFICATIONS CASCADE;
DROP TABLE IF EXISTS TRANSIT_UPDATES CASCADE;
DROP TABLE IF EXISTS REFERRAL_ATTACHMENTS CASCADE;
DROP TABLE IF EXISTS REFERRAL_DETAILS CASCADE;
DROP TABLE IF EXISTS REFERRALS CASCADE;
DROP TABLE IF EXISTS HOSPITAL_RESOURCES CASCADE;
DROP TABLE IF EXISTS SPECIALISTS CASCADE;
DROP TABLE IF EXISTS PATIENTS CASCADE;
DROP TABLE IF EXISTS PHYSICIANS CASCADE;
DROP TABLE IF EXISTS USERS CASCADE;
DROP TABLE IF EXISTS HOSPITALS CASCADE;
DROP TABLE IF EXISTS ROLE CASCADE;


-- ==========================================================================
-- 1. ROLE
-- ==========================================================================
CREATE TABLE ROLE (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(20) UNIQUE NOT NULL,
    description TEXT
);


-- ==========================================================================
-- 2. HOSPITALS
-- ==========================================================================
CREATE TABLE HOSPITALS (
    hospital_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    gps_coordinates POINT,
    address TEXT NOT NULL,
    -- GHS facility classification
    level VARCHAR(20) NOT NULL CHECK (level IN (
        'teaching', 'regional', 'district', 'polyclinic', 'health_centre', 'chps'
    )),
    ownership VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (ownership IN (
        'public', 'private', 'faith_based', 'military', 'quasi_government'
    )),
    operating_hours VARCHAR(100),
    contact_phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================================
-- 3. USERS
-- ==========================================================================
CREATE TABLE USERS (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role_id INTEGER NOT NULL REFERENCES ROLE(role_id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    -- Generated column so queries can SELECT full_name without concatenation
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    phone_number VARCHAR(20),
    hospital_id INTEGER REFERENCES HOSPITALS(hospital_id),
    -- Supabase Auth
    auth_uid VARCHAR(255) UNIQUE,
    profile_picture_url TEXT,
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================================
-- 4. PHYSICIANS
-- ==========================================================================
-- A physician is a user with role 'physician'. This table holds professional
-- details that only apply to physicians. The hospital affiliation lives on
-- USERS.hospital_id (single source of truth).
-- ==========================================================================
CREATE TABLE PHYSICIANS (
    physician_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES USERS(user_id),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    -- Professional details
    title VARCHAR(20) CHECK (title IN ('Mr', 'Mrs', 'Dr', 'Prof')),
    specialization VARCHAR(50),
    department VARCHAR(50),
    grade VARCHAR(50),
    -- On-call availability (toggled by hospital admin)
    availability BOOLEAN NOT NULL DEFAULT FALSE,
    -- Schedule and verification
    work_schedule JSONB,
    digital_signature_path VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================================
-- 5. PATIENTS
-- ==========================================================================
CREATE TABLE PATIENTS (
    patient_id SERIAL PRIMARY KEY,
    -- The physician who registered the patient
    physician_id INTEGER NOT NULL REFERENCES PHYSICIANS(physician_id),
    -- The hospital where the patient is registered
    hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    patient_identifier VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    date_of_birth DATE,
    sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'other')),
    nhis_number VARCHAR(50),
    nhis_status VARCHAR(20) CHECK (nhis_status IN ('Active', 'Expired', 'None')),
    contact_number VARCHAR(20),
    address TEXT,
    next_of_kin_name VARCHAR(255),
    next_of_kin_contact VARCHAR(20),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================================
-- 6. HOSPITAL_RESOURCES
-- ==========================================================================
CREATE TABLE HOSPITAL_RESOURCES (
    resource_id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    resource_type VARCHAR(30) NOT NULL CHECK (resource_type IN (
        -- Bed categories
        'general_beds',
        'emergency_beds',
        'icu_beds',
        'stroke_beds',
        'pediatric_beds',
        'maternity_beds',
        'oxygen_beds',
        'monitored_beds',
        'adjustable_beds',
        -- Equipment and services
        'theatre',
        'blood_bank',
        'lab',
        'xray',
        'ct_scan',
        'mri',
        'ultrasound',
        'dialysis',
        'ventilators',
        'oxygen'
    )),
    total_count INTEGER,
    available_count INTEGER,
    is_available BOOLEAN,
    operator_required BOOLEAN NOT NULL DEFAULT FALSE,
    operator_specialty VARCHAR(50),
    availability_schedule JSONB,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_available_lte_total CHECK (available_count <= total_count)
);


-- ==========================================================================
-- 7. SPECIALISTS
-- ==========================================================================
-- Specialist records represent a hospital's capability to treat a specific
-- condition category. They are separate from physician user accounts.
-- The routing algorithm checks specialist on_call status, NOT physician
-- availability, when determining hospital capability.
-- ==========================================================================
CREATE TABLE SPECIALISTS (
    specialist_id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    specialty VARCHAR(50) NOT NULL,
    specialist_name VARCHAR(255),
    availability_schedule JSONB,
    on_call_available BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================================
-- 8. REFERRALS
-- ==========================================================================
CREATE TABLE REFERRALS (
    referral_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES PATIENTS(patient_id),
    referring_physician_id INTEGER NOT NULL REFERENCES PHYSICIANS(physician_id),
    referring_hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    receiving_hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    assigned_physician_id INTEGER REFERENCES PHYSICIANS(physician_id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'in_transit', 'arrived', 'completed', 'cancelled', 'no_capacity'
    )),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    stability VARCHAR(10) NOT NULL CHECK (stability IN ('stable', 'unstable')),
    emergency_type VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (emergency_type IN (
        'cardiac', 'trauma', 'respiratory', 'stroke', 'obstetric', 'seizure', 'general'
    )),
    -- Routing engine metadata
    routing_queue TEXT,
    cascade_count INTEGER NOT NULL DEFAULT 0,
    routing_metadata TEXT,
    incident_lat DOUBLE PRECISION,
    incident_lon DOUBLE PRECISION,
    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    arrived_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    -- Context
    rejection_reason TEXT,
    cancellation_reason TEXT,
    estimated_arrival_minutes INTEGER,
    -- Outcome tracking
    outcome VARCHAR(50),
    outcome_notes TEXT,
    outcome_recorded_at TIMESTAMP,
    CONSTRAINT chk_different_hospitals CHECK (referring_hospital_id != receiving_hospital_id)
);


-- ==========================================================================
-- 9. REFERRAL_DETAILS
-- ==========================================================================
CREATE TABLE REFERRAL_DETAILS (
    detail_id SERIAL PRIMARY KEY,
    referral_id INTEGER NOT NULL UNIQUE REFERENCES REFERRALS(referral_id) ON DELETE CASCADE,
    presenting_complaint TEXT NOT NULL,
    clinical_history TEXT,
    initial_diagnosis TEXT,
    current_condition TEXT,
    clinical_summary TEXT,
    examination_findings TEXT,
    working_diagnosis TEXT,
    reason_for_referral TEXT,
    investigations_done TEXT,
    treatment_given TEXT,
    additional_notes TEXT,
    required_specialist VARCHAR(50),
    required_facility VARCHAR(50)
);


-- ==========================================================================
-- 10. REFERRAL_ATTACHMENTS
-- ==========================================================================
CREATE TABLE REFERRAL_ATTACHMENTS (
    attachment_id SERIAL PRIMARY KEY,
    referral_id INTEGER NOT NULL REFERENCES REFERRALS(referral_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('pdf', 'jpg', 'jpeg', 'png', 'webp')),
    file_size_bytes INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES USERS(user_id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_file_size CHECK (file_size_bytes <= 10485760)  -- 10MB max
);


-- ==========================================================================
-- 11. TRANSIT_UPDATES
-- ==========================================================================
CREATE TABLE TRANSIT_UPDATES (
    update_id SERIAL PRIMARY KEY,
    referral_id INTEGER NOT NULL REFERENCES REFERRALS(referral_id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    logged_by INTEGER NOT NULL REFERENCES USERS(user_id),
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================================
-- 12. NOTIFICATIONS
-- ==========================================================================
CREATE TABLE NOTIFICATIONS (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES USERS(user_id),
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'hospital_approval', 'hospital_rejection',
        'physician_verification', 'physician_rejection',
        'referral_created', 'referral_approved', 'referral_rejected',
        'referral_completed', 'referral_cancelled',
        'referral_assigned', 'referral_assigned_update',
        'referral_no_capacity', 'referral_status_changed',
        'patient_arrived', 'data_flagged',
        'account_approved', 'account_rejected',
        'patient_dispatched', 'transit_update'
    )),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    CONSTRAINT chk_read_time CHECK (is_read = FALSE OR read_at IS NOT NULL)
);


-- ==========================================================================
-- 13. HOSPITAL_DATA_FLAGS
-- ==========================================================================
CREATE TABLE HOSPITAL_DATA_FLAGS (
    flag_id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    referral_id INTEGER REFERENCES REFERRALS(referral_id),
    flagging_physician_id INTEGER NOT NULL REFERENCES PHYSICIANS(physician_id),
    category VARCHAR(255) NOT NULL,
    notes TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================================
-- 14. ADMIN_INVITES
-- ==========================================================================
CREATE TABLE ADMIN_INVITES (
    invite_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_by INTEGER NOT NULL REFERENCES USERS(user_id),
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================================
-- 15. AUDIT_LOGS
-- ==========================================================================
CREATE TABLE AUDIT_LOGS (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES USERS(user_id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================================
-- INDEXES
-- ==========================================================================

-- Users
CREATE INDEX idx_users_email ON USERS(email);
CREATE INDEX idx_users_role ON USERS(role_id);
CREATE INDEX idx_users_hospital ON USERS(hospital_id);
CREATE INDEX idx_users_auth_uid ON USERS(auth_uid);

-- Hospitals
CREATE INDEX idx_hospitals_gps ON HOSPITALS USING GIST(gps_coordinates);
CREATE INDEX idx_hospitals_status ON HOSPITALS(status);
CREATE INDEX idx_hospitals_level ON HOSPITALS(level);

-- Hospital Resources
CREATE INDEX idx_hospital_resources_hospital ON HOSPITAL_RESOURCES(hospital_id);
CREATE INDEX idx_hospital_resources_type ON HOSPITAL_RESOURCES(resource_type);
CREATE INDEX idx_hospital_resources_updated ON HOSPITAL_RESOURCES(last_updated);

-- Specialists
CREATE INDEX idx_specialists_hospital ON SPECIALISTS(hospital_id);
CREATE INDEX idx_specialists_specialty ON SPECIALISTS(specialty);

-- Physicians
CREATE INDEX idx_physicians_user ON PHYSICIANS(user_id);

-- Patients
CREATE INDEX idx_patients_physician ON PATIENTS(physician_id);
CREATE INDEX idx_patients_hospital ON PATIENTS(hospital_id);
CREATE INDEX idx_patients_identifier ON PATIENTS(patient_identifier);

-- Referrals
CREATE INDEX idx_referrals_patient ON REFERRALS(patient_id);
CREATE INDEX idx_referrals_referring_physician ON REFERRALS(referring_physician_id);
CREATE INDEX idx_referrals_referring_hospital ON REFERRALS(referring_hospital_id);
CREATE INDEX idx_referrals_receiving_hospital ON REFERRALS(receiving_hospital_id);
CREATE INDEX idx_referrals_assigned_physician ON REFERRALS(assigned_physician_id);
CREATE INDEX idx_referrals_status ON REFERRALS(status);

-- Referral Attachments
CREATE INDEX idx_attachments_referral ON REFERRAL_ATTACHMENTS(referral_id);

-- Transit Updates
CREATE INDEX idx_transit_updates_referral ON TRANSIT_UPDATES(referral_id);

-- Notifications
CREATE INDEX idx_notifications_user ON NOTIFICATIONS(user_id);
CREATE INDEX idx_notifications_read ON NOTIFICATIONS(is_read);

-- Hospital Data Flags
CREATE INDEX idx_hospital_flags_hospital ON HOSPITAL_DATA_FLAGS(hospital_id);

-- Admin Invites
CREATE INDEX idx_admin_invites_token ON ADMIN_INVITES(token);
