import {
    User, Hospital, Patient, Referral, Specialist, Resource,
    Notification, PhysicianStats, HospitalStats, AdminStats,
    HospitalRecommendation
} from '@/types';

// Mock Users
export const mockUsers: User[] = [
    {
        id: 'user-1',
        email: 'admin@healthref.com',
        name: 'System Admin',
        role: 'super_admin',
        created_at: '2026-01-01T00:00:00Z'
    },
    {
        id: 'user-2',
        email: 'hospital@general.com',
        name: 'General Hospital',
        role: 'hospital_admin',
        hospital_id: 'hosp-1',
        created_at: '2026-01-15T00:00:00Z'
    },
    {
        id: 'user-3',
        email: 'physician@clinic.com',
        name: 'Dr. Sarah Johnson',
        role: 'physician',
        hospital_id: 'hosp-2',
        specialty: 'General Practice',
        license_number: 'MD-12345',
        years_of_experience: 12,
        phone: '+233 24 123 4567',
        created_at: '2026-01-20T00:00:00Z'
    }
];

// Mock Hospitals
export const mockHospitals: Hospital[] = [
    {
        id: 'hosp-1',
        name: 'City General Hospital',
        type: 'General Hospital',
        address: '123 Main Street, Accra',
        latitude: 5.6037,
        longitude: -0.1870,
        total_beds: 200,
        icu_capacity: 30,
        contact_person: 'John Administrator',
        contact_email: 'contact@citygeneral.com',
        contact_phone: '(555) 123-4567',
        status: 'Approved',
        created_at: '2026-01-02T00:00:00Z'
    },
    {
        id: 'hosp-2',
        name: 'Downtown Medical Clinic',
        type: 'Clinic',
        address: '456 Central Ave, Accra',
        latitude: 5.5913,
        longitude: -0.1786,
        total_beds: 50,
        icu_capacity: 5,
        contact_person: 'Mary Coordinator',
        contact_email: 'contact@downtown.com',
        contact_phone: '(555) 234-5678',
        status: 'Approved',
        created_at: '2026-01-05T00:00:00Z'
    },
    {
        id: 'hosp-3',
        name: "St. Mary's Medical Center",
        type: 'Medical Center',
        address: '456 Oak Ave, Westside',
        latitude: 5.5850,
        longitude: -0.2010,
        total_beds: 180,
        icu_capacity: 25,
        contact_person: 'Mary Johnson',
        contact_email: 'contact@stmarys.com',
        contact_phone: '(555) 234-5678',
        status: 'Pending',
        created_at: '2026-02-01T00:00:00Z'
    },
    {
        id: 'hosp-4',
        name: 'Riverside Specialty Hospital',
        type: 'Specialty Hospital',
        address: '789 River Road, Accra',
        latitude: 5.6100,
        longitude: -0.1950,
        total_beds: 120,
        icu_capacity: 20,
        contact_person: 'Robert Smith',
        contact_email: 'contact@riverside.com',
        contact_phone: '(555) 345-6789',
        status: 'Pending',
        created_at: '2026-02-02T00:00:00Z'
    }
];

// Mock Patients
export const mockPatients: Patient[] = [
    {
        id: 'pat-1',
        name: 'John Doe',
        age: 58,
        date_of_birth: '1968-03-15',
        gender: 'Male',
        address: '123 Patient Street, Accra',
        nhis_status: 'Active',
        diagnosis: 'Acute Myocardial Infarction',
        physician_id: 'user-3',
        last_visit: '2026-02-02',
        created_at: '2026-01-10T00:00:00Z'
    },
    {
        id: 'pat-2',
        name: 'Jane Smith',
        age: 34,
        date_of_birth: '1992-07-22',
        gender: 'Female',
        address: '456 Health Ave, Accra',
        nhis_status: 'Active',
        diagnosis: 'ACL Tear',
        physician_id: 'user-3',
        last_visit: '2026-01-28',
        created_at: '2026-01-15T00:00:00Z'
    },
    {
        id: 'pat-3',
        name: 'Robert Johnson',
        age: 45,
        date_of_birth: '1981-11-08',
        gender: 'Male',
        address: '789 Medical Lane, Accra',
        nhis_status: 'Expired',
        diagnosis: 'Possible Stroke',
        physician_id: 'user-3',
        last_visit: '2026-02-02',
        created_at: '2026-01-20T00:00:00Z'
    },
    {
        id: 'pat-4',
        name: 'Maria Garcia',
        age: 62,
        date_of_birth: '1964-05-30',
        gender: 'Female',
        address: '321 Care Blvd, Accra',
        nhis_status: 'Active',
        diagnosis: 'Type 2 Diabetes',
        physician_id: 'user-3',
        last_visit: '2026-01-27',
        created_at: '2026-01-25T00:00:00Z'
    }
];

// Mock Referrals
export const mockReferrals: Referral[] = [
    {
        id: 'ref-1',
        patient_id: 'pat-1',
        patient_name: 'John Doe',
        patient_age: 58,
        condition: 'Acute Myocardial Infarction',
        urgency: 'Emergency',
        hospital_id: 'hosp-1',
        hospital_name: 'City General Hospital',
        referring_physician_id: 'user-3',
        referring_physician_name: 'Dr. Sarah Johnson',
        referring_facility: 'Downtown Medical Clinic',
        status: 'Pending',
        requested_at: '2026-02-03T22:17:37Z'
    },
    {
        id: 'ref-2',
        patient_id: 'pat-2',
        patient_name: 'Jane Smith',
        patient_age: 34,
        condition: 'Orthopedic Surgery - ACL Repair',
        urgency: 'Routine',
        hospital_id: 'hosp-1',
        hospital_name: 'City General Hospital',
        referring_physician_id: 'user-4',
        referring_physician_name: 'Dr. Michael Brown',
        referring_facility: 'Sports Medicine Clinic',
        status: 'Pending',
        requested_at: '2026-02-03T20:47:37Z'
    },
    {
        id: 'ref-3',
        patient_id: 'pat-3',
        patient_name: 'Robert Johnson',
        patient_age: 45,
        condition: 'Stroke Assessment',
        urgency: 'Urgent',
        hospital_id: 'hosp-1',
        hospital_name: 'City General Hospital',
        referring_physician_id: 'user-5',
        referring_physician_name: 'Dr. Emily Rodriguez',
        referring_facility: 'Community Health Center',
        status: 'Accepted',
        response_notes: 'Patient accepted. ICU bed reserved.',
        requested_at: '2026-02-03T21:17:37Z',
        responded_at: '2026-02-03T21:45:00Z'
    }
];

// Mock Specialists
export const mockSpecialists: Specialist[] = [
    { id: 'spec-1', name: 'Dr. James Wilson', specialty: 'Cardiology', hospital_id: 'hosp-1', available: true },
    { id: 'spec-2', name: 'Dr. Robert Taylor', specialty: 'Orthopedics', hospital_id: 'hosp-1', available: false },
    { id: 'spec-3', name: 'Dr. Lisa Anderson', specialty: 'Neurology', hospital_id: 'hosp-1', available: true },
    { id: 'spec-4', name: 'Dr. Maria Garcia', specialty: 'Oncology', hospital_id: 'hosp-1', available: true },
    { id: 'spec-5', name: 'Dr. David Lee', specialty: 'Pediatrics', hospital_id: 'hosp-1', available: true }
];

// Mock Resources (for City General Hospital)
export const mockResources: Resource[] = [
    {
        id: 'res-1',
        hospital_id: 'hosp-1',
        type: 'General Beds',
        total: 150,
        available: 42,
        reserved: 8,
        last_updated: '2026-02-03T22:47:37Z'
    },
    {
        id: 'res-2',
        hospital_id: 'hosp-1',
        type: 'ICU Beds',
        total: 30,
        available: 5,
        reserved: 2,
        last_updated: '2026-02-03T22:47:37Z'
    },
    {
        id: 'res-3',
        hospital_id: 'hosp-1',
        type: 'Emergency Beds',
        total: 20,
        available: 12,
        reserved: 3,
        last_updated: '2026-02-03T22:47:37Z'
    }
];

// Mock Notifications
export const mockNotifications: Notification[] = [];

// Mock Stats
export const mockPhysicianStats: PhysicianStats = {
    active_patients: 4,
    pending_referrals: 1,
    accepted_referrals: 1,
    total_referrals: 2
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
    pending_physicians: 2,
    active_hospitals: 1,
    verified_physicians: 1
};

// Mock Physician Applications
export const mockPhysicianApplications: User[] = [
    {
        id: 'user-app-1',
        email: 'sarah.johnson@downtown.com',
        name: 'Dr. Sarah Johnson',
        role: 'physician',
        specialty: 'Cardiology',
        license_number: 'MD-12345',
        years_of_experience: 12,
        hospital_id: 'hosp-2',
        created_at: '2026-01-31T00:00:00Z'
    },
    {
        id: 'user-app-2',
        email: 'michael.chen@neuro.com',
        name: 'Dr. Michael Chen',
        role: 'physician',
        specialty: 'Neurology',
        license_number: 'MD-23456',
        years_of_experience: 8,
        created_at: '2026-02-02T00:00:00Z'
    },
    {
        id: 'user-app-3',
        email: 'emily.rodriguez@children.com',
        name: 'Dr. Emily Rodriguez',
        role: 'physician',
        specialty: 'Pediatrics',
        license_number: 'MD-34567',
        years_of_experience: 15,
        created_at: '2026-02-02T00:00:00Z'
    }
];

// Mock Hospital Recommendations
export const mockRecommendations: HospitalRecommendation[] = [
    {
        hospital: mockHospitals[0],
        match_score: 95,
        distance_km: 2.3,
        estimated_wait: '< 2 hours',
        available_beds: 42,
        acceptance_rate: 92,
        available_specialists: 3,
        data_freshness: 'Fresh'
    },
    {
        hospital: mockHospitals[2],
        match_score: 88,
        distance_km: 4.1,
        estimated_wait: '2-4 hours',
        available_beds: 28,
        acceptance_rate: 85,
        available_specialists: 2,
        data_freshness: 'Fresh'
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
