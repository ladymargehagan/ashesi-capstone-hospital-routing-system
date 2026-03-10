'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { StatsCard } from '@/components/stats-card';
import { HospitalsTable } from '@/components/admin/hospitals-table';
import { PhysiciansTable } from '@/components/admin/physicians-table';
import { hospitalsApi, usersApi } from '@/lib/api-client';
import { Hospital, Physician } from '@/types';
import { Building2, Users, CheckCircle, Clock, Search, Loader2, Stethoscope, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('physicians');
    const [searchQuery, setSearchQuery] = useState('');
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [physicians, setPhysicians] = useState<Physician[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        setLoading(true);
        Promise.all([
            hospitalsApi.list().catch(() => []),
            usersApi.listPhysicians().catch(() => []),
        ]).then(([hosps, physs]) => {
            setHospitals(hosps as unknown as Hospital[]);
            setPhysicians(physs as unknown as Physician[]);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const pendingPhysicians = physicians.filter(p => p.status === 'pending');
    const activePhysicians = physicians.filter(p => p.status === 'active');

    // Filter based on search
    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.level || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.address || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPhysicians = physicians.filter(p =>
        (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.license_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.hospital_name || '').toLowerCase().includes(searchQuery.toLowerCase())
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
                <p className="text-gray-500">Manage physician registrations and view the hospital network</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title="Pending Doctors"
                    value={pendingPhysicians.length}
                    description="Awaiting approval"
                    icon={Clock}
                    iconColor="text-amber-600"
                />
                <StatsCard
                    title="Active Doctors"
                    value={activePhysicians.length}
                    description="Verified & active"
                    icon={Stethoscope}
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Total Hospitals"
                    value={hospitals.length}
                    description="In the network"
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
                <h2 className="text-lg font-semibold mb-1">System Overview</h2>
                <p className="text-sm text-gray-500 mb-4">Approve doctor registrations and browse the hospital directory</p>

                {/* Tabs with Search */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="physicians">
                                <Activity className="h-4 w-4 mr-1.5" />
                                Physicians ({physicians.length})
                                {pendingPhysicians.length > 0 && (
                                    <span className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                                        {pendingPhysicians.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="hospitals">
                                <Building2 className="h-4 w-4 mr-1.5" />
                                Hospitals ({hospitals.length})
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

                    <TabsContent value="physicians" className="mt-0">
                        <PhysiciansTable physicians={filteredPhysicians} onStatusChanged={loadData} />
                    </TabsContent>

                    <TabsContent value="hospitals" className="mt-0">
                        <HospitalsTable hospitals={filteredHospitals} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
