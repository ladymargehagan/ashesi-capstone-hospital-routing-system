/**
 * Centralized API client for the HRS backend.
 *
 * All frontend components should import from here instead of mock-data.ts.
 * The API_BASE URL points to the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Generic fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T = unknown>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        credentials: 'include', // send cookies for auth
        headers: {
            'Content-Type': 'application/json',
            ...((options.headers as Record<string, string>) || {}),
        },
        ...options,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        let message = `API error ${res.status}`;
        if (typeof body.detail === 'string') {
            message = body.detail;
        } else if (Array.isArray(body.detail)) {
            message = body.detail.map((e: { msg?: string; loc?: string[] }) =>
                e.msg || JSON.stringify(e)
            ).join('; ');
        }
        throw new Error(message);
    }

    return res.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
    login: (email: string, password: string) =>
        apiFetch<{ success: boolean; status?: string; user?: Record<string, unknown> }>(
            '/api/auth/login',
            { method: 'POST', body: JSON.stringify({ email, password }) },
        ),

    register: (data: Record<string, unknown>) =>
        apiFetch<{ success: boolean; user_id?: string }>(
            '/api/auth/register',
            { method: 'POST', body: JSON.stringify(data) },
        ),

    me: () =>
        apiFetch<{ user: Record<string, unknown> | null }>('/api/auth/me'),

    logout: () =>
        apiFetch('/api/auth/logout', { method: 'POST' }),
};

// ---------------------------------------------------------------------------
// Hospitals (read-only — hospitals are pre-loaded)
// ---------------------------------------------------------------------------

export const hospitalsApi = {
    list: (status?: string) =>
        apiFetch<Record<string, unknown>[]>(
            `/api/hospitals${status ? `?status=${status}` : ''}`,
        ),

    get: (id: string) =>
        apiFetch<Record<string, unknown>>(`/api/hospitals/${id}`),
};

// ---------------------------------------------------------------------------
// Referrals
// ---------------------------------------------------------------------------

export const referralsApi = {
    list: (params?: { physician_id?: string; hospital_id?: string; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.physician_id) qs.set('physician_id', params.physician_id);
        if (params?.hospital_id) qs.set('hospital_id', params.hospital_id);
        if (params?.status) qs.set('status', params.status);
        const query = qs.toString();
        return apiFetch<Record<string, unknown>[]>(`/api/referrals${query ? `?${query}` : ''}`);
    },

    get: (id: string) =>
        apiFetch<Record<string, unknown>>(`/api/referrals/${id}`),

    create: (data: Record<string, unknown>) =>
        apiFetch<{ success: boolean; referral_id: string }>(
            '/api/referrals',
            { method: 'POST', body: JSON.stringify(data) },
        ),

    updateStatus: (id: string, status: string, reason?: string) =>
        apiFetch<{ success: boolean }>(
            `/api/referrals/${id}/status`,
            { method: 'PUT', body: JSON.stringify({ status, reason }) },
        ),

    assign: (id: string, physicianId: string) =>
        apiFetch<{ success: boolean }>(
            `/api/referrals/${id}/assign`,
            { method: 'PUT', body: JSON.stringify({ physician_id: parseInt(physicianId) }) },
        ),

    uploadAttachment: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const url = `${API_BASE}/api/referrals/${id}/attachments`;
        const res = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            body: formData,
            // Do NOT set Content-Type — browser will set it with boundary for multipart
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(typeof body.detail === 'string' ? body.detail : `Upload failed: ${res.status}`);
        }
        return res.json() as Promise<{ success: boolean; attachment_id: string; file_name: string }>;
    },
};

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export const resourcesApi = {
    list: (hospitalId: string) =>
        apiFetch<Record<string, unknown>[]>(`/api/resources/${hospitalId}`),

    update: (resourceId: string, data: Record<string, unknown>) =>
        apiFetch<{ success: boolean }>(
            `/api/resources/${resourceId}`,
            { method: 'PUT', body: JSON.stringify(data) },
        ),

    add: (hospitalId: string, data: Record<string, unknown>) =>
        apiFetch<{ success: boolean; resource_id: string }>(
            `/api/resources/${hospitalId}`,
            { method: 'POST', body: JSON.stringify(data) },
        ),
};

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export const patientsApi = {
    list: (physicianId?: string) =>
        apiFetch<Record<string, unknown>[]>(
            `/api/patients${physicianId ? `?physician_id=${physicianId}` : ''}`,
        ),

    get: (id: string) =>
        apiFetch<Record<string, unknown>>(`/api/patients/${id}`),

    create: (data: Record<string, unknown>) =>
        apiFetch<{ success: boolean; patient_id: string }>(
            '/api/patients',
            { method: 'POST', body: JSON.stringify(data) },
        ),
};

// ---------------------------------------------------------------------------
// Users (admin)
// ---------------------------------------------------------------------------

export const usersApi = {
    list: (params?: { role?: string; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.role) qs.set('role', params.role);
        if (params?.status) qs.set('status', params.status);
        const query = qs.toString();
        return apiFetch<Record<string, unknown>[]>(`/api/users${query ? `?${query}` : ''}`);
    },

    updateStatus: (id: string, status: string) =>
        apiFetch<{ success: boolean }>(
            `/api/users/${id}/status`,
            { method: 'PUT', body: JSON.stringify({ status }) },
        ),

    listPhysicians: (params?: { hospital_id?: string; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.hospital_id) qs.set('hospital_id', params.hospital_id);
        if (params?.status) qs.set('status', params.status);
        const query = qs.toString();
        return apiFetch<Record<string, unknown>[]>(`/api/users/physicians${query ? `?${query}` : ''}`);
    },

    updateProfile: (id: string, data: { full_name?: string; phone_number?: string }) =>
        apiFetch<{ success: boolean }>(
            `/api/users/${id}/profile`,
            { method: 'PUT', body: JSON.stringify(data) },
        ),

    updateRole: (id: string, role: string, hospitalId?: string) =>
        apiFetch<{ success: boolean; new_role: string }>(
            `/api/users/${id}/role`,
            { method: 'PUT', body: JSON.stringify({ role, hospital_id: hospitalId ? parseInt(hospitalId) : null }) },
        ),
};

// ---------------------------------------------------------------------------
// Specialists
// ---------------------------------------------------------------------------

export const specialistsApi = {
    list: (hospitalId: string) =>
        apiFetch<Record<string, unknown>[]>(`/api/specialists/${hospitalId}`),

    create: (data: Record<string, unknown>) =>
        apiFetch<{ success: boolean; specialist_id: string }>(
            '/api/specialists',
            { method: 'POST', body: JSON.stringify(data) },
        ),

    update: (id: string, data: Record<string, unknown>) =>
        apiFetch<{ success: boolean }>(
            `/api/specialists/${id}`,
            { method: 'PUT', body: JSON.stringify(data) },
        ),

    delete: (id: string) =>
        apiFetch<{ success: boolean }>(
            `/api/specialists/${id}`,
            { method: 'DELETE' },
        ),
};

// ---------------------------------------------------------------------------
// Stats (dashboard)
// ---------------------------------------------------------------------------

export const statsApi = {
    physician: (physicianId: string) =>
        apiFetch<Record<string, unknown>>(`/api/stats/physician/${physicianId}`),

    hospital: (hospitalId: string) =>
        apiFetch<Record<string, unknown>>(`/api/stats/hospital/${hospitalId}`),

    admin: () =>
        apiFetch<Record<string, unknown>>('/api/stats/admin'),
};

// ---------------------------------------------------------------------------
// Recommend (referral engine)
// ---------------------------------------------------------------------------

export const recommendApi = {
    rank: (data: { lat: number; lon: number; emergency_type: string; severity: string; stability: string }) =>
        apiFetch<Record<string, unknown>>(
            '/api/recommend',
            { method: 'POST', body: JSON.stringify(data) },
        ),
};

// ---------------------------------------------------------------------------
// Maps key
// ---------------------------------------------------------------------------

export const mapsApi = {
    getKey: () =>
        apiFetch<{ key: string | null }>('/api/maps-key'),
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notificationsApi = {
    list: () =>
        apiFetch<Record<string, unknown>[]>('/api/notifications'),

    unreadCount: () =>
        apiFetch<{ unread_count: number }>('/api/notifications/unread-count'),

    markRead: (id: string) =>
        apiFetch<{ success: boolean }>(
            `/api/notifications/${id}/read`,
            { method: 'PUT' },
        ),

    markAllRead: () =>
        apiFetch<{ success: boolean; marked_read: number }>(
            '/api/notifications/read-all',
            { method: 'PUT' },
        ),
};

// ---------------------------------------------------------------------------
// Resource display name helper (pure client-side — no API call)
// ---------------------------------------------------------------------------

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
        oxygen: 'Oxygen Supply',
    };
    return names[type] || type;
};
