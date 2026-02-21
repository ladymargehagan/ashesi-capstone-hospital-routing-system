'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { resourcesApi } from '@/lib/api-client';
import { ResourcesTab } from '@/components/hospital/resources-tab';
import { Resource } from '@/types';
import { Loader2 } from 'lucide-react';

export default function HospitalResourcesPage() {
    const { user } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchResources = useCallback(() => {
        if (!user?.hospital_id) return;
        resourcesApi.list(user.hospital_id)
            .then((data) => setResources(data as unknown as Resource[]))
            .catch((err) => console.error('Failed to load resources:', err))
            .finally(() => setLoading(false));
    }, [user?.hospital_id]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

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
                <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
                <p className="text-gray-500">Update bed availability and facility resources</p>
            </div>

            <ResourcesTab resources={resources} onResourceUpdated={fetchResources} />
        </div>
    );
}
