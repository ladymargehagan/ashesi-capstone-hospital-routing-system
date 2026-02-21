'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { specialistsApi } from '@/lib/api-client';
import { SpecialistsTab } from '@/components/hospital/specialists-tab';
import { Specialist } from '@/types';
import { Loader2 } from 'lucide-react';

export default function HospitalSpecialistsPage() {
    const { user } = useAuth();
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSpecialists = useCallback(() => {
        if (!user?.hospital_id) return;
        specialistsApi.list(user.hospital_id)
            .then((data) => setSpecialists(data as unknown as Specialist[]))
            .catch((err) => console.error('Failed to load specialists:', err))
            .finally(() => setLoading(false));
    }, [user?.hospital_id]);

    useEffect(() => {
        fetchSpecialists();
    }, [fetchSpecialists]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Specialist Management</h1>
                <p className="text-gray-500">View and manage hospital specialists</p>
            </div>

            <SpecialistsTab specialists={specialists} onSpecialistUpdated={fetchSpecialists} />
        </div>
    );
}
