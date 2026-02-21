// User roles in the system
export type UserRole = 'physician' | 'hospital_admin' | 'super_admin';

// User interface (maps to USERS table)
export interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    phone_number?: string;
    hospital_id?: string;
    status: 'active' | 'pending' | 'rejected';
    created_at: string;
    updated_at?: string;
}

// Physician interface (maps to PHYSICIANS table - separate from users)
export interface Physician {
    id: string;
    user_id: string;
    hospital_id: string;
    license_number: string;
    specialization?: string;
    work_schedule?: Record<string, unknown>;
    digital_signature_path?: string;
    status: 'active' | 'pending' | 'rejected';
    created_at: string;
    updated_at?: string;
    // Derived from user join
    full_name?: string;
    email?: string;
    phone_number?: string;
}

// Hospital types (maps to HOSPITALS table)
export type HospitalTier = 'tier_1' | 'tier_2' | 'tier_3';
export type HospitalType = 'polyclinic' | 'district' | 'regional' | 'teaching' | 'specialist';
export type HospitalOwnership = 'public' | 'private' | 'faith_based' | 'military';
export type HospitalStatus = 'active' | 'pending' | 'rejected';

// Hospital interface
export interface Hospital {
    id: string;
    name: string;
    license_number: string;
    gps_coordinates?: { lat: number; lng: number };
    address: string;
    tier: HospitalTier;
    type: HospitalType;
    ownership: HospitalOwnership;
    operating_hours?: string;
    contact_phone?: string;
    status: HospitalStatus;
    created_at: string;
    updated_at?: string;
}

// Patient interface (maps to PATIENTS table)
export interface Patient {
    id: string;
    physician_id: string;
    patient_identifier: string;
    full_name: string;
    date_of_birth?: string;
    sex?: 'male' | 'female' | 'other';
    nhis_number?: string;
    nhis_status?: 'Active' | 'Expired' | 'None';
    contact_number?: string;
    address?: string;
    next_of_kin_name?: string;
    next_of_kin_contact?: string;
    registered_at: string;
    // Derived fields for display
    diagnosis?: string;
    last_visit?: string;
}

// Referral severity and status (maps to REFERRALS table)
export type ReferralSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ReferralStability = 'stable' | 'unstable';
export type ReferralStatus = 'pending' | 'approved' | 'rejected' | 'en_route' | 'completed' | 'cancelled';

// Emergency types supported by the referral engine (referral_engine.py REQUIRED_RESOURCES keys)
export type EmergencyType = 'cardiac' | 'trauma' | 'respiratory' | 'stroke' | 'obstetric' | 'seizure' | 'general';

// Referral interface
export interface Referral {
    id: string;
    patient_id: string;
    referring_physician_id: string;
    referring_hospital_id: string;
    receiving_hospital_id: string;
    status: ReferralStatus;
    severity: ReferralSeverity;
    stability: ReferralStability;
    submitted_at: string;
    approved_at?: string;
    rejected_at?: string;
    completed_at?: string;
    cancelled_at?: string;
    rejection_reason?: string;
    cancellation_reason?: string;
    estimated_arrival_minutes?: number;
    // Derived fields for display
    patient_name?: string;
    patient_age?: number;
    referring_physician_name?: string;
    referring_hospital_name?: string;
    receiving_hospital_name?: string;
}

// Referral details (maps to REFERRAL_DETAILS table)
export interface ReferralDetails {
    id: string;
    referral_id: string;
    presenting_complaint: string;
    clinical_history?: string;
    initial_diagnosis?: string;
    current_condition?: string;
    clinical_summary?: string;
    examination_findings?: string;
    working_diagnosis?: string;
    reason_for_referral?: string;
    investigations_done?: string;
    treatment_given?: string;
    additional_notes?: string;
    required_specialist?: string;
    required_facility?: string;
}

// Referral form data (combines REFERRALS + REFERRAL_DETAILS for form submission)
export interface ReferralFormData {
    // Patient Details
    patient_id: string;
    full_name: string;
    date_of_birth: string;
    sex: 'male' | 'female' | 'other';
    address: string;
    nhis_number: string;
    nhis_status: 'Active' | 'Expired' | 'None';
    contact_number: string;

    // Clinical Details (REFERRAL_DETAILS)
    presenting_complaint: string;
    clinical_history: string;
    examination_findings: string;
    working_diagnosis: string;
    investigations_done: string;
    treatment_given: string;
    reason_for_referral: string;

    // Referral Details (REFERRALS)
    severity: ReferralSeverity;
    stability: ReferralStability;
    emergency_type: EmergencyType;
    referral_datetime: string;

    // Hospital Selection
    receiving_hospital_id?: string;
}

// Specialist interface (maps to SPECIALISTS table)
export interface Specialist {
    id: string;
    hospital_id: string;
    specialty: string;
    specialist_name?: string;
    availability_schedule?: Record<string, unknown>;
    on_call_available: boolean;
    created_at?: string;
    updated_at?: string;
}

// Resource types (maps to HOSPITAL_RESOURCES table)
export type ResourceType =
    | 'general_beds' | 'icu_beds' | 'pediatric_beds' | 'maternity_beds'
    | 'theatre' | 'blood_bank' | 'lab' | 'xray' | 'ct_scan'
    | 'mri' | 'ultrasound' | 'dialysis' | 'ventilators' | 'oxygen';

// Resource interface
export interface Resource {
    id: string;
    hospital_id: string;
    resource_type: ResourceType;
    total_count?: number;
    available_count?: number;
    is_available?: boolean;
    operator_required: boolean;
    operator_specialty?: string;
    availability_schedule?: Record<string, unknown>;
    last_updated: string;
}

// --- Engine output types (mirror referral_engine.py ReferralEngine.rank() output) ---

export interface ResourceAvailability {
    resource: string;
    available: boolean;
    details: {
        available?: number;
        quantity?: number;
        on_call?: boolean;
        operational?: boolean;
        weight?: number;
    };
}

export interface EngineRecommendation {
    rank: number;
    hospital_name: string;
    hospital_id: string;
    hospital_type: string;
    contact: string;
    distance_km: number;
    travel_time_minutes: number;
    composite_score: number;
    resource_score: number;
    proximity_score: number;
    freshness_factor: number;
    last_update_hours_ago: number;
    resource_availability: ResourceAvailability[];
    distance_band_density_estimate?: number;
    hospital_lat?: number;
    hospital_lon?: number;
}

export interface EngineResponse {
    input_summary: {
        emergency_type: string;
        severity: string;
        stability: string;
        time: string;
        radius_km: number;
    };
    debug: {
        counts: {
            total: number;
            nearby: number;
            open_now: number;
            capable: number;
            partial_fallback_used: boolean;
        };
        weights: {
            alpha_capability: number;
            beta_proximity: number;
        };
        tmax_minutes: number;
    };
    warnings: string[];
    recommendations: EngineRecommendation[];
}

// Notification interface (maps to NOTIFICATIONS table)
export interface Notification {
    id: string;
    user_id: string;
    message: string;
    type: 'hospital_approval' | 'hospital_rejection' | 'physician_verification' | 'physician_rejection' | 'referral_approved' | 'referral_rejected' | 'referral_completed' | 'patient_arrived' | 'data_flagged';
    is_read: boolean;
    created_at: string;
    read_at?: string;
}

// Dashboard stats
export interface PhysicianStats {
    active_patients: number;
    pending_referrals: number;
    accepted_referrals: number;
    total_referrals: number;
}

export interface HospitalStats {
    total_beds: number;
    available_beds: number;
    icu_capacity: number;
    icu_available: number;
    specialists_available: number;
    specialists_total: number;
    pending_referrals: number;
}

export interface AdminStats {
    pending_hospitals: number;
    total_physicians: number;
    active_hospitals: number;
    total_hospitals: number;
}

// Hospital registration form data
export interface HospitalRegistrationData {
    // Hospital fields (→ HOSPITALS table)
    hospital_name: string;
    license_number: string;
    address: string;
    tier: HospitalTier;
    type: HospitalType;
    ownership: HospitalOwnership;
    operating_hours: string;
    contact_phone: string;
    gps_lat: string;
    gps_lng: string;
    // Admin account fields (→ USERS table)
    admin_full_name: string;
    admin_email: string;
    admin_phone: string;
    admin_password: string;
    admin_password_confirm: string;
}
