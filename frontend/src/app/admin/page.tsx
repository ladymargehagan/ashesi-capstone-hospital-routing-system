'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { StatsCard } from '@/components/stats-card';
import { HospitalsTable } from '@/components/admin/hospitals-table';
import { PhysiciansTable } from '@/components/admin/physicians-table';
import { hospitalsApi, usersApi, statsApi } from '@/lib/api-client';
import { Hospital, Physician } from '@/types';
import { Building2, Users, CheckCircle, Clock, Search, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('hospitals');
    const [searchQuery, setSearchQuery] = useState('');
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [physicians, setPhysicians] = useState<Physician[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            hospitalsApi.list().catch(() => []),
            usersApi.listPhysicians().catch(() => []),
            statsApi.admin().catch(() => ({})),
        ]).then(([hosps, physs]) => {
            setHospitals(hosps as unknown as Hospital[]);
            setPhysicians(physs as unknown as Physician[]);
        }).finally(() => setLoading(false));
    }, []);

    const pendingHospitals = hospitals.filter(h => h.status === 'pending');
    const activeHospitals = hospitals.filter(h => h.status === 'active');

    // Filter based on search
    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPhysicians = physicians.filter(p =>
        p.license_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.specialization?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500">Manage hospital applications and view system overview</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title="Pending Hospitals"
                    value={pendingHospitals.length}
                    description="Awaiting approval"
                    icon={Clock}
                    iconColor="text-amber-600"
                />
                <StatsCard
                    title="Active Hospitals"
                    value={activeHospitals.length}
                    description="Currently approved"
                    icon={CheckCircle}
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Total Hospitals"
                    value={hospitals.length}
                    description="All registered"
                    icon={Building2}
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Total Physicians"
                    value={physicians.length}
                    description="Across all hospitals"
                    icon={Users}
                    iconColor="text-purple-600"
                />
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-1">Overview</h2>
                <p className="text-sm text-gray-500 mb-4">Review hospital applications and physician directory</p>

                {/* Tabs with Search */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="hospitals">
                                Hospitals ({hospitals.length})
                            </TabsTrigger>
                            <TabsTrigger value="physicians">
                                Physicians ({physicians.length})
                            </TabsTrigger>
                        </TabsList>

                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <TabsContent value="hospitals" className="mt-0">
                        <HospitalsTable hospitals={filteredHospitals} />
                    </TabsContent>

                    <TabsContent value="physicians" className="mt-0">
                        <PhysiciansTable physicians={filteredPhysicians} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
