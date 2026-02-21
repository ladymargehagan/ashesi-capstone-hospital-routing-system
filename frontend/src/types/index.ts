// User roles in the system
export type UserRole = 'physician' | 'hospital_admin' | 'super_admin';

// User interface
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    hospital_id?: string;
    phone?: string;
    specialty?: string;
    license_number?: string;
    years_of_experience?: number;
    created_at: string;
}

// Hospital types
export type HospitalType = 'General Hospital' | 'Medical Center' | 'Specialty Hospital' | 'Clinic';
export type HospitalStatus = 'Pending' | 'Approved' | 'Rejected';

// Hospital interface
export interface Hospital {
    id: string;
    name: string;
    type: HospitalType;
    address: string;
    latitude?: number;
    longitude?: number;
    total_beds: number;
    icu_capacity: number;
    contact_person: string;
    contact_email: string;
    contact_phone: string;
    status: HospitalStatus;
    created_at: string;
}

// Patient interface
export interface Patient {
    id: string;
    name: string;
    age: number;
    date_of_birth: string;
    gender: 'Male' | 'Female';
    address: string;
    nhis_status: 'Active' | 'Expired' | 'None';
    diagnosis: string;
    physician_id: string;
    last_visit: string;
    created_at: string;
}

// Referral urgency and status
export type ReferralUrgency = 'Emergency' | 'Urgent' | 'Routine';
export type ReferralStatus = 'Pending' | 'Accepted' | 'Rejected';

// Referral interface
export interface Referral {
    id: string;
    patient_id: string;
    patient_name: string;
    patient_age: number;
    condition: string;
    urgency: ReferralUrgency;
    hospital_id: string;
    hospital_name: string;
    referring_physician_id: string;
    referring_physician_name: string;
    referring_facility: string;
    status: ReferralStatus;
    response_notes?: string;
    requested_at: string;
    responded_at?: string;
}

// Referral form data (NHIS/MOH compliant)
export interface ReferralFormData {
    // Patient Details
    patient_id: string;
    full_name: string;
    age: number;
    date_of_birth: string;
    sex: 'Male' | 'Female';
    address: string;
    nhis_status: 'Active' | 'Expired' | 'None';

    // Clinical Details
    presenting_complaint: string;
    clinical_history: string;
    examination_findings: string;
    investigations_results: string;
    diagnosis: string;
    treatment_given: string;

    // Referral Details
    reason_for_referral: string;
    urgency: ReferralUrgency;
    referral_datetime: string;

    // Hospital Selection
    hospital_id?: string;
}

// Specialist interface
export interface Specialist {
    id: string;
    name: string;
    specialty: string;
    hospital_id: string;
    available: boolean;
}

// Resource types
export type ResourceType = 'General Beds' | 'ICU Beds' | 'Emergency Beds';

// Resource interface
export interface Resource {
    id: string;
    hospital_id: string;
    type: ResourceType;
    total: number;
    available: number;
    reserved: number;
    last_updated: string;
}

// Hospital recommendation from algorithm
export interface HospitalRecommendation {
    hospital: Hospital;
    match_score: number;
    distance_km: number;
    estimated_wait: string;
    available_beds: number;
    acceptance_rate: number;
    available_specialists: number;
    data_freshness: 'Fresh' | 'Stale' | 'Outdated';
}

// Notification interface
export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'referral' | 'approval' | 'system';
    is_read: boolean;
    created_at: string;
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
