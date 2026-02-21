'use client';

import { SpecialistsTab } from '@/components/hospital/specialists-tab';
import { mockSpecialists } from '@/lib/mock-data';

export default function HospitalSpecialistsPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Specialist Management</h1>
                <p className="text-gray-500">View and manage hospital specialists</p>
            </div>

            <SpecialistsTab specialists={mockSpecialists} />
        </div>
    );
}
