import {
    User, Hospital, Patient, Referral, ReferralDetails, Specialist, Resource,
    Notification, PhysicianStats, HospitalStats, AdminStats,
    HospitalRecommendation, Physician
} from '@/types';

// Mock Users (maps to USERS table)
export const mockUsers: User[] = [
    {
        id: 'user-1',
        email: 'admin@healthref.com',
        full_name: 'System Admin',
        role: 'super_admin',
        phone_number: '+233 20 000 0001',
        status: 'active',
        created_at: '2026-01-01T00:00:00Z'
    },
    {
        id: 'user-2',
        email: 'hospital@general.com',
        full_name: 'John Administrator',
        role: 'hospital_admin',
        hospital_id: 'hosp-1',
        phone_number: '+233 24 555 1234',
        status: 'active',
        created_at: '2026-01-15T00:00:00Z'
    },
    {
        id: 'user-3',
        email: 'physician@clinic.com',
        full_name: 'Dr. Sarah Johnson',
        role: 'physician',
        hospital_id: 'hosp-2',
        phone_number: '+233 24 123 4567',
        status: 'active',
        created_at: '2026-01-20T00:00:00Z'
    }
];

// Mock Physicians (maps to PHYSICIANS table)
export const mockPhysicians: Physician[] = [
    {
        id: 'phys-1',
        user_id: 'user-3',
        hospital_id: 'hosp-2',
        license_number: 'MD-12345',
        specialization: 'General Practice',
        status: 'active',
        created_at: '2026-01-20T00:00:00Z',
        full_name: 'Dr. Sarah Johnson',
        email: 'physician@clinic.com',
        phone_number: '+233 24 123 4567'
    },
    {
        id: 'phys-2',
        user_id: 'user-app-1',
        hospital_id: 'hosp-1',
        license_number: 'MD-23456',
        specialization: 'Cardiology',
        status: 'active',
        created_at: '2026-01-25T00:00:00Z',
        full_name: 'Dr. Michael Brown',
        email: 'michael.brown@citygeneral.com'
    },
    {
        id: 'phys-3',
        user_id: 'user-app-2',
        hospital_id: 'hosp-1',
        license_number: 'MD-34567',
        specialization: 'Neurology',
        status: 'active',
        created_at: '2026-01-28T00:00:00Z',
        full_name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@citygeneral.com'
    }
];

// Mock Hospitals (maps to HOSPITALS table)
export const mockHospitals: Hospital[] = [
    {
        id: 'hosp-1',
        name: 'City General Hospital',
        license_number: 'HLC-001',
        address: '123 Main Street, Accra',
        gps_coordinates: { lat: 5.6037, lng: -0.1870 },
        tier: 'tier_3',
        type: 'teaching',
        ownership: 'public',
        operating_hours: '24/7',
        contact_phone: '+233 30 277 1234',
        status: 'active',
        created_at: '2026-01-02T00:00:00Z'
    },
    {
        id: 'hosp-2',
        name: 'Downtown Medical Clinic',
        license_number: 'HLC-002',
        address: '456 Central Ave, Accra',
        gps_coordinates: { lat: 5.5913, lng: -0.1786 },
        tier: 'tier_1',
        type: 'polyclinic',
        ownership: 'private',
        operating_hours: 'Mon-Sat 7am-8pm',
        contact_phone: '+233 30 277 2345',
        status: 'active',
        created_at: '2026-01-05T00:00:00Z'
    },
    {
        id: 'hosp-3',
        name: "St. Mary's Medical Center",
        license_number: 'HLC-003',
        address: '456 Oak Ave, Kumasi',
        gps_coordinates: { lat: 6.6884, lng: -1.6244 },
        tier: 'tier_2',
        type: 'regional',
        ownership: 'faith_based',
        operating_hours: '24/7',
        contact_phone: '+233 32 202 3456',
        status: 'pending',
        created_at: '2026-02-01T00:00:00Z'
    },
    {
        id: 'hosp-4',
        name: 'Riverside Specialty Hospital',
        license_number: 'HLC-004',
        address: '789 River Road, Accra',
        gps_coordinates: { lat: 5.6100, lng: -0.1950 },
        tier: 'tier_2',
        type: 'specialist',
        ownership: 'private',
        operating_hours: '24/7',
        contact_phone: '+233 30 277 4567',
        status: 'pending',
        created_at: '2026-02-02T00:00:00Z'
    },
    {
        id: 'hosp-5',
        name: 'Korle Bu Teaching Hospital',
        license_number: 'HLC-005',
        address: '1 Guggisberg Ave, Accra',
        gps_coordinates: { lat: 5.5348, lng: -0.2271 },
        tier: 'tier_3',
        type: 'teaching',
        ownership: 'public',
        operating_hours: '24/7',
        contact_phone: '+233 30 266 5678',
        status: 'active',
        created_at: '2026-01-03T00:00:00Z'
    },
    {
        id: 'hosp-6',
        name: 'Ridge Hospital',
        license_number: 'HLC-006',
        address: 'Castle Road, Ridge, Accra',
        gps_coordinates: { lat: 5.5589, lng: -0.1969 },
        tier: 'tier_2',
        type: 'regional',
        ownership: 'public',
        operating_hours: '24/7',
        contact_phone: '+233 30 266 6789',
        status: 'active',
        created_at: '2026-01-04T00:00:00Z'
    },
    {
        id: 'hosp-7',
        name: 'Lister Hospital',
        license_number: 'HLC-007',
        address: '23 North Airport Rd, Accra',
        gps_coordinates: { lat: 5.6050, lng: -0.1720 },
        tier: 'tier_2',
        type: 'specialist',
        ownership: 'private',
        operating_hours: '24/7',
        contact_phone: '+233 30 281 7890',
        status: 'active',
        created_at: '2026-01-06T00:00:00Z'
    }
];

// Mock Patients (maps to PATIENTS table)
export const mockPatients: Patient[] = [
    {
        id: 'pat-1',
        physician_id: 'phys-1',
        patient_identifier: 'PID-2026-001',
        full_name: 'John Doe',
        date_of_birth: '1968-03-15',
        sex: 'male',
        nhis_number: 'NHIS-100234',
        nhis_status: 'Active',
        contact_number: '+233 24 888 1234',
        address: '123 Patient Street, Accra',
        next_of_kin_name: 'Mary Doe',
        next_of_kin_contact: '+233 24 888 5678',
        registered_at: '2026-01-10T00:00:00Z',
        diagnosis: 'Acute Myocardial Infarction',
        last_visit: '2026-02-02'
    },
    {
        id: 'pat-2',
        physician_id: 'phys-1',
        patient_identifier: 'PID-2026-002',
        full_name: 'Jane Smith',
        date_of_birth: '1992-07-22',
        sex: 'female',
        nhis_number: 'NHIS-100456',
        nhis_status: 'Active',
        contact_number: '+233 20 555 2345',
        address: '456 Health Ave, Accra',
        next_of_kin_name: 'Peter Smith',
        next_of_kin_contact: '+233 20 555 6789',
        registered_at: '2026-01-15T00:00:00Z',
        diagnosis: 'ACL Tear',
        last_visit: '2026-01-28'
    },
    {
        id: 'pat-3',
        physician_id: 'phys-1',
        patient_identifier: 'PID-2026-003',
        full_name: 'Robert Johnson',
        date_of_birth: '1981-11-08',
        sex: 'male',
        nhis_status: 'Expired',
        contact_number: '+233 24 333 3456',
        address: '789 Medical Lane, Accra',
        next_of_kin_name: 'Lisa Johnson',
        next_of_kin_contact: '+233 24 333 7890',
        registered_at: '2026-01-20T00:00:00Z',
        diagnosis: 'Possible Stroke',
        last_visit: '2026-02-02'
    },
    {
        id: 'pat-4',
        physician_id: 'phys-1',
        patient_identifier: 'PID-2026-004',
        full_name: 'Maria Garcia',
        date_of_birth: '1964-05-30',
        sex: 'female',
        nhis_number: 'NHIS-100789',
        nhis_status: 'Active',
        contact_number: '+233 50 444 4567',
        address: '321 Care Blvd, Accra',
        next_of_kin_name: 'Carlos Garcia',
        next_of_kin_contact: '+233 50 444 8901',
        registered_at: '2026-01-25T00:00:00Z',
        diagnosis: 'Type 2 Diabetes',
        last_visit: '2026-01-27'
    }
];

// Mock Referrals (maps to REFERRALS table)
export const mockReferrals: Referral[] = [
    {
        id: 'ref-1',
        patient_id: 'pat-1',
        referring_physician_id: 'phys-1',
        referring_hospital_id: 'hosp-2',
        receiving_hospital_id: 'hosp-1',
        status: 'pending',
        severity: 'critical',
        stability: 'unstable',
        submitted_at: '2026-02-03T22:17:37Z',
        estimated_arrival_minutes: 20,
        patient_name: 'John Doe',
        patient_age: 58,
        referring_physician_name: 'Dr. Sarah Johnson',
        referring_hospital_name: 'Downtown Medical Clinic',
        receiving_hospital_name: 'City General Hospital'
    },
    {
        id: 'ref-2',
        patient_id: 'pat-2',
        referring_physician_id: 'phys-2',
        referring_hospital_id: 'hosp-1',
        receiving_hospital_id: 'hosp-5',
        status: 'pending',
        severity: 'low',
        stability: 'stable',
        submitted_at: '2026-02-03T20:47:37Z',
        patient_name: 'Jane Smith',
        patient_age: 34,
        referring_physician_name: 'Dr. Michael Brown',
        referring_hospital_name: 'City General Hospital',
        receiving_hospital_name: 'Korle Bu Teaching Hospital'
    },
    {
        id: 'ref-3',
        patient_id: 'pat-3',
        referring_physician_id: 'phys-3',
        referring_hospital_id: 'hosp-1',
        receiving_hospital_id: 'hosp-6',
        status: 'approved',
        severity: 'high',
        stability: 'stable',
        submitted_at: '2026-02-03T21:17:37Z',
        approved_at: '2026-02-03T21:45:00Z',
        estimated_arrival_minutes: 30,
        patient_name: 'Robert Johnson',
        patient_age: 45,
        referring_physician_name: 'Dr. Emily Rodriguez',
        referring_hospital_name: 'City General Hospital',
        receiving_hospital_name: 'Ridge Hospital'
    }
];

// Mock Referral Details (maps to REFERRAL_DETAILS table)
export const mockReferralDetails: ReferralDetails[] = [
    {
        id: 'rd-1',
        referral_id: 'ref-1',
        presenting_complaint: 'Chest pain, shortness of breath, radiating pain to left arm',
        clinical_history: 'History of hypertension for 10 years. Family history of cardiac disease.',
        initial_diagnosis: 'Acute Myocardial Infarction',
        current_condition: 'Severe chest pain, diaphoresis, ST elevation on ECG',
        examination_findings: 'BP 180/100, HR 110, SpO2 92%, ECG shows ST elevation in leads II, III, aVF',
        working_diagnosis: 'Acute ST-elevation MI (Inferior)',
        reason_for_referral: 'Requires urgent PCI - no catheterization lab at referring facility',
        investigations_done: 'ECG, Troponin I (elevated), CBC, BMP',
        treatment_given: 'Aspirin 300mg, Clopidogrel 600mg, Morphine 4mg IV, IV fluids'
    },
    {
        id: 'rd-2',
        referral_id: 'ref-2',
        presenting_complaint: 'Right knee instability after sports injury',
        clinical_history: 'Recreational football player, no prior knee injuries',
        initial_diagnosis: 'ACL Tear',
        current_condition: 'Stable, ambulatory with crutches',
        examination_findings: 'Positive Lachman test, positive anterior drawer test, moderate effusion',
        working_diagnosis: 'Complete ACL rupture, right knee',
        reason_for_referral: 'Requires orthopedic surgical consultation and MRI confirmation',
        investigations_done: 'X-ray (normal), Physical exam positive for ACL tear',
        treatment_given: 'RICE protocol, NSAIDs, knee immobilizer'
    }
];

// Mock Specialists (maps to SPECIALISTS table)
export const mockSpecialists: Specialist[] = [
    { id: 'spec-1', hospital_id: 'hosp-1', specialty: 'Cardiology', specialist_name: 'Dr. James Wilson', on_call_available: true },
    { id: 'spec-2', hospital_id: 'hosp-1', specialty: 'Orthopedics', specialist_name: 'Dr. Robert Taylor', on_call_available: false },
    { id: 'spec-3', hospital_id: 'hosp-1', specialty: 'Neurology', specialist_name: 'Dr. Lisa Anderson', on_call_available: true },
    { id: 'spec-4', hospital_id: 'hosp-1', specialty: 'Oncology', specialist_name: 'Dr. Maria Garcia', on_call_available: true },
    { id: 'spec-5', hospital_id: 'hosp-1', specialty: 'Pediatrics', specialist_name: 'Dr. David Lee', on_call_available: true }
];

// Mock Resources (maps to HOSPITAL_RESOURCES table)
export const mockResources: Resource[] = [
    {
        id: 'res-1',
        hospital_id: 'hosp-1',
        resource_type: 'general_beds',
        total_count: 150,
        available_count: 42,
        is_available: true,
        operator_required: false,
        last_updated: '2026-02-03T22:47:37Z'
    },
    {
        id: 'res-2',
        hospital_id: 'hosp-1',
        resource_type: 'icu_beds',
        total_count: 30,
        available_count: 5,
        is_available: true,
        operator_required: true,
        operator_specialty: 'Intensive Care',
        last_updated: '2026-02-03T22:47:37Z'
    },
    {
        id: 'res-3',
        hospital_id: 'hosp-1',
        resource_type: 'theatre',
        total_count: 8,
        available_count: 3,
        is_available: true,
        operator_required: true,
        operator_specialty: 'Surgery',
        last_updated: '2026-02-03T22:47:37Z'
    },
    {
        id: 'res-4',
        hospital_id: 'hosp-1',
        resource_type: 'ventilators',
        total_count: 20,
        available_count: 8,
        is_available: true,
        operator_required: true,
        operator_specialty: 'Respiratory Therapy',
        last_updated: '2026-02-03T22:00:00Z'
    },
    {
        id: 'res-5',
        hospital_id: 'hosp-1',
        resource_type: 'maternity_beds',
        total_count: 25,
        available_count: 12,
        is_available: true,
        operator_required: false,
        last_updated: '2026-02-03T21:30:00Z'
    }
];

// Mock Notifications
export const mockNotifications: Notification[] = [];

// Mock Stats
export const mockPhysicianStats: PhysicianStats = {
    active_patients: 4,
    pending_referrals: 1,
    accepted_referrals: 1,
    total_referrals: 3
};

export const mockHospitalStats: HospitalStats = {
    total_beds: 200,
    available_beds: 59,
    icu_capacity: 30,
    icu_available: 5,
    specialists_available: 4,
    specialists_total: 5,
    pending_referrals: 2
};

export const mockAdminStats: AdminStats = {
    pending_hospitals: 2,
    total_physicians: 3,
    active_hospitals: 5,
    total_hospitals: 7
};

// Mock Physician Applications (physicians table joined with users)
export const mockPhysicianApplications: Physician[] = [
    {
        id: 'phys-1',
        user_id: 'user-3',
        hospital_id: 'hosp-2',
        license_number: 'MD-12345',
        specialization: 'General Practice',
        status: 'active',
        created_at: '2026-01-20T00:00:00Z',
        full_name: 'Dr. Sarah Johnson',
        email: 'physician@clinic.com'
    },
    {
        id: 'phys-2',
        user_id: 'user-app-1',
        hospital_id: 'hosp-1',
        license_number: 'MD-23456',
        specialization: 'Cardiology',
        status: 'active',
        created_at: '2026-01-25T00:00:00Z',
        full_name: 'Dr. Michael Brown',
        email: 'michael.brown@citygeneral.com'
    },
    {
        id: 'phys-3',
        user_id: 'user-app-2',
        hospital_id: 'hosp-1',
        license_number: 'MD-34567',
        specialization: 'Neurology',
        status: 'active',
        created_at: '2026-01-28T00:00:00Z',
        full_name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@citygeneral.com'
    }
];

// Mock Hospital Recommendations (5 recommendations)
export const mockRecommendations: HospitalRecommendation[] = [
    {
        hospital: mockHospitals[0], // City General
        match_score: 95,
        distance_km: 2.3,
        estimated_wait: '< 2 hours',
        available_beds: 42,
        acceptance_rate: 92,
        available_specialists: 3,
        data_freshness: 'Fresh'
    },
    {
        hospital: mockHospitals[4], // Korle Bu
        match_score: 91,
        distance_km: 5.8,
        estimated_wait: '2-3 hours',
        available_beds: 65,
        acceptance_rate: 88,
        available_specialists: 8,
        data_freshness: 'Fresh'
    },
    {
        hospital: mockHospitals[5], // Ridge Hospital
        match_score: 87,
        distance_km: 3.5,
        estimated_wait: '1-2 hours',
        available_beds: 28,
        acceptance_rate: 85,
        available_specialists: 4,
        data_freshness: 'Fresh'
    },
    {
        hospital: mockHospitals[6], // Lister Hospital
        match_score: 82,
        distance_km: 1.8,
        estimated_wait: '< 1 hour',
        available_beds: 15,
        acceptance_rate: 90,
        available_specialists: 3,
        data_freshness: 'Stale'
    },
    {
        hospital: mockHospitals[2], // St. Mary's
        match_score: 76,
        distance_km: 8.2,
        estimated_wait: '3-4 hours',
        available_beds: 38,
        acceptance_rate: 80,
        available_specialists: 2,
        data_freshness: 'Stale'
    }
];

// Helper function to get current user (simulated auth)
export const getCurrentUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
};

// Helper function to set current user (simulated login)
export const setCurrentUser = (user: User | null) => {
    if (typeof window === 'undefined') return;
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
};

// Helper to find user by email
export const findUserByEmail = (email: string): User | undefined => {
    return mockUsers.find(u => u.email === email);
};

// Helper to get resource type display name
export const getResourceDisplayName = (type: string): string => {
    const names: Record<string, string> = {
        general_beds: 'General Beds',
        icu_beds: 'ICU Beds',
        pediatric_beds: 'Pediatric Beds',
        maternity_beds: 'Maternity Beds',
        theatre: 'Operating Theatre',
        blood_bank: 'Blood Bank',
        lab: 'Laboratory',
        xray: 'X-Ray',
        ct_scan: 'CT Scan',
        mri: 'MRI',
        ultrasound: 'Ultrasound',
        dialysis: 'Dialysis',
        ventilators: 'Ventilators',
        oxygen: 'Oxygen Supply'
    };
    return names[type] || type;
};

// Helper to get active (approved) hospitals
export const getActiveHospitals = (): Hospital[] => {
    return mockHospitals.filter(h => h.status === 'active');
};

// Register a new hospital + admin user (both start as 'pending')
export const registerHospital = (data: {
    hospital_name: string;
    license_number: string;
    address: string;
    tier: Hospital['tier'];
    type: Hospital['type'];
    ownership: Hospital['ownership'];
    operating_hours: string;
    contact_phone: string;
    gps_lat: string;
    gps_lng: string;
    admin_full_name: string;
    admin_email: string;
    admin_phone: string;
}): { hospital: Hospital; user: User } => {
    const hospitalId = `hosp-${Date.now()}`;
    const userId = `user-${Date.now()}`;
    const now = new Date().toISOString();

    const newHospital: Hospital = {
        id: hospitalId,
        name: data.hospital_name,
        license_number: data.license_number,
        address: data.address,
        tier: data.tier,
        type: data.type,
        ownership: data.ownership,
        operating_hours: data.operating_hours || undefined,
        contact_phone: data.contact_phone || undefined,
        gps_coordinates: data.gps_lat && data.gps_lng
            ? { lat: parseFloat(data.gps_lat), lng: parseFloat(data.gps_lng) }
            : undefined,
        status: 'pending',
        created_at: now,
    };

    const newUser: User = {
        id: userId,
        email: data.admin_email,
        full_name: data.admin_full_name,
        role: 'hospital_admin',
        hospital_id: hospitalId,
        phone_number: data.admin_phone || undefined,
        status: 'pending',
        created_at: now,
    };

    mockHospitals.push(newHospital);
    mockUsers.push(newUser);

    return { hospital: newHospital, user: newUser };
};
