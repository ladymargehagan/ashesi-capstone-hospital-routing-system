CREATE TABLE ROLE (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(20) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE HOSPITALS (
    hospital_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    gps_coordinates POINT NOT NULL,
    address TEXT NOT NULL,
    tier VARCHAR(10) NOT NULL CHECK (tier IN ('tier_1', 'tier_2', 'tier_3')),
    type VARCHAR(30) NOT NULL CHECK (type IN ('polyclinic', 'district', 'regional', 'teaching', 'specialist')),
    ownership VARCHAR(20) NOT NULL CHECK (ownership IN ('public', 'private', 'faith_based', 'military')),
    operating_hours VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE USERS (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES ROLE(role_id),
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    hospital_id INTEGER REFERENCES HOSPITALS(hospital_id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE HOSPITAL_RESOURCES (
    resource_id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    resource_type VARCHAR(30) NOT NULL CHECK (resource_type IN ('general_beds', 'icu_beds', 'pediatric_beds', 'maternity_beds', 'theatre', 'blood_bank', 'lab', 'xray', 'ct_scan', 'mri', 'ultrasound', 'dialysis', 'ventilators', 'oxygen')),
    total_count INTEGER,
    available_count INTEGER,
    is_available BOOLEAN,
    operator_required BOOLEAN NOT NULL DEFAULT FALSE,
    operator_specialty VARCHAR(50),
    availability_schedule JSONB,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_available_lte_total CHECK (available_count <= total_count)
);

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

CREATE TABLE PHYSICIANS (
    physician_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES USERS(user_id),
    hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(50),
    work_schedule JSONB,
    digital_signature_path VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE PATIENTS (
    patient_id SERIAL PRIMARY KEY,
    physician_id INTEGER NOT NULL REFERENCES PHYSICIANS(physician_id),
    patient_identifier VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'other')),
    nhis_number VARCHAR(50),
    contact_number VARCHAR(20),
    next_of_kin_name VARCHAR(255),
    next_of_kin_contact VARCHAR(20),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE REFERRALS (
    referral_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES PATIENTS(patient_id),
    referring_physician_id INTEGER NOT NULL REFERENCES PHYSICIANS(physician_id),
    referring_hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    receiving_hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'en_route', 'completed', 'cancelled')),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    stability VARCHAR(10) NOT NULL CHECK (stability IN ('stable', 'unstable')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    rejection_reason TEXT,
    cancellation_reason TEXT,
    estimated_arrival_minutes INTEGER,
    CONSTRAINT chk_different_hospitals CHECK (referring_hospital_id != receiving_hospital_id)
);

CREATE TABLE REFERRAL_DETAILS (
    detail_id SERIAL PRIMARY KEY,
    referral_id INTEGER NOT NULL UNIQUE REFERENCES REFERRALS(referral_id),
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

CREATE TABLE NOTIFICATIONS (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES USERS(user_id),
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('hospital_approval', 'hospital_rejection', 'physician_verification', 'physician_rejection', 'referral_approved', 'referral_rejected', 'referral_completed', 'patient_arrived', 'data_flagged')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    CONSTRAINT chk_read_time CHECK (is_read = FALSE OR read_at IS NOT NULL)
);

CREATE TABLE PASSWORD_RESETS (
    reset_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES USERS(user_id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE AUDIT_LOGS (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES USERS(user_id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON USERS(email);
CREATE INDEX idx_users_role ON USERS(role_id);
CREATE INDEX idx_users_hospital ON USERS(hospital_id);
CREATE INDEX idx_hospitals_gps ON HOSPITALS USING GIST(gps_coordinates);
CREATE INDEX idx_hospitals_status ON HOSPITALS(status);
CREATE INDEX idx_hospital_resources_hospital ON HOSPITAL_RESOURCES(hospital_id);
CREATE INDEX idx_hospital_resources_type ON HOSPITAL_RESOURCES(resource_type);
CREATE INDEX idx_hospital_resources_updated ON HOSPITAL_RESOURCES(last_updated);
CREATE INDEX idx_specialists_hospital ON SPECIALISTS(hospital_id);
CREATE INDEX idx_specialists_specialty ON SPECIALISTS(specialty);
CREATE INDEX idx_physicians_user ON PHYSICIANS(user_id);
CREATE INDEX idx_physicians_hospital ON PHYSICIANS(hospital_id);
CREATE INDEX idx_patients_physician ON PATIENTS(physician_id);
CREATE INDEX idx_patients_identifier ON PATIENTS(patient_identifier);
CREATE INDEX idx_referrals_patient ON REFERRALS(patient_id);
CREATE INDEX idx_referrals_referring_physician ON REFERRALS(referring_physician_id);
CREATE INDEX idx_referrals_receiving_hospital ON REFERRALS(receiving_hospital_id);
CREATE INDEX idx_referrals_status ON REFERRALS(status);
CREATE INDEX idx_notifications_user ON NOTIFICATIONS(user_id);
CREATE INDEX idx_notifications_read ON NOTIFICATIONS(is_read);


-- PATIENTS table
ALTER TABLE PATIENTS 
ADD COLUMN address TEXT,
ADD COLUMN nhis_status VARCHAR(20) CHECK (nhis_status IN ('Active', 'Expired', 'None'));

-- REFERRAL_DETAILS table
ALTER TABLE REFERRAL_DETAILS 
ADD COLUMN presenting_complaint TEXT NOT NULL,
ADD COLUMN clinical_history TEXT;

-- HOSPITALS table
ALTER TABLE HOSPITALS 
ADD COLUMN contact_phone VARCHAR(20);

-- REFERRALS table (if you want separate urgency field)
ALTER TABLE REFERRALS 
--ADD COLUMN urgency VARCHAR(20) CHECK (urgency IN ('Emergency', 'Urgent', 'Routine'));