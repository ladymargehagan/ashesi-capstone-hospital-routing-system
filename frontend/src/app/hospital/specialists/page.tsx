'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usersApi } from '@/lib/api-client';
import { Physician } from '@/types';
import { Loader2 } from 'lucide-react';
import { SpecialistsTab } from '@/components/hospital/specialists-tab';

export default function HospitalSpecialistsPage() {
    const { user } = useAuth();
    const [specialists, setSpecialists] = useState<Physician[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSpecialists = useCallback(() => {
        if (!user?.hospital_id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        usersApi.listPhysicians({ hospital_id: user.hospital_id, status: 'active' })
            .then((data) => {
                const physicians = data as unknown as Physician[];
                // Only show physicians with a non-generalist specialization
                const GENERALIST = new Set([
                    'General Practice',
                    'Emergency Medicine',
                    'Internal Medicine',
                    'Surgery (General)',
                ]);
                const withSpec = physicians.filter(
                    p => p.specialization
                        && p.specialization.trim() !== ''
                        && !GENERALIST.has(p.specialization)
                );
                setSpecialists(withSpec);
            })
            .catch((err) => console.error('Failed to load specialists:', err))
            .finally(() => setLoading(false));
    }, [user?.hospital_id]);

    useEffect(() => {
        fetchSpecialists();
    }, [fetchSpecialists]);

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
                <h1 className="text-2xl font-bold text-gray-900">Specialists</h1>
                <p className="text-gray-500">
                    Physicians at your hospital who have a specialization. Toggle their availability to signal capability to the routing algorithm.
                </p>
            </div>

            <SpecialistsTab specialists={specialists} onUpdated={fetchSpecialists} />
        </div>
    );
}
