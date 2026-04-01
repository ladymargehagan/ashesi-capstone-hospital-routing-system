'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usersApi } from '@/lib/api-client';
import { HospitalPhysiciansTab } from '@/components/hospital/physicians-tab';
import { Physician } from '@/types';
import { Loader2 } from 'lucide-react';

export default function HospitalPhysiciansPage() {
    const { user } = useAuth();
    const [physicians, setPhysicians] = useState<Physician[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPhysicians = useCallback(() => {
        if (!user?.hospital_id) return;
        usersApi.listPhysicians({ hospital_id: user.hospital_id })
            .then((data) => setPhysicians(data as unknown as Physician[]))
            .catch((err) => console.error('Failed to load physicians:', err))
            .finally(() => setLoading(false));
    }, [user?.hospital_id]);

    useEffect(() => {
        fetchPhysicians();
    }, [fetchPhysicians]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Physicians</h1>
                <p className="text-gray-500">Doctors registered at your facility — approve or reject pending accounts</p>
            </div>

            <div className="bg-white rounded-lg border p-6">
                <HospitalPhysiciansTab physicians={physicians} onStatusChanged={fetchPhysicians} />
            </div>
        </div>
    );
}
