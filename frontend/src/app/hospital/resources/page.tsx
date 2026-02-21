'use client';

import { ResourcesTab } from '@/components/hospital/resources-tab';
import { mockResources } from '@/lib/mock-data';

export default function HospitalResourcesPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
                <p className="text-gray-500">Update bed availability and facility resources</p>
            </div>

            <ResourcesTab resources={mockResources} />
        </div>
    );
}
