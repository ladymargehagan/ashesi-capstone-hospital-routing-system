'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { StatsCard } from '@/components/stats-card';
import { HospitalsTable } from '@/components/admin/hospitals-table';
import { PhysiciansTable } from '@/components/admin/physicians-table';
import { mockAdminStats, mockHospitals, mockPhysicianApplications } from '@/lib/mock-data';
import { Building2, UserCheck, CheckCircle, Users, Search } from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('hospitals');
    const [searchQuery, setSearchQuery] = useState('');
    const stats = mockAdminStats;

    // Filter hospitals by status
    const pendingHospitals = mockHospitals.filter(h => h.status === 'Pending');
    const approvedHospitals = mockHospitals.filter(h => h.status === 'Approved');

    // Filter based on search
    const filteredHospitals = mockHospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPhysicians = mockPhysicianApplications.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.specialty?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500">Manage hospital and physician applications</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title="Pending Hospitals"
                    value={stats.pending_hospitals}
                    description="Awaiting approval"
                    icon={Building2}
                    iconColor="text-amber-600"
                />
                <StatsCard
                    title="Pending Physicians"
                    value={stats.pending_physicians}
                    description="Awaiting verification"
                    icon={Users}
                    iconColor="text-amber-600"
                />
                <StatsCard
                    title="Active Hospitals"
                    value={stats.active_hospitals}
                    description="Currently active"
                    icon={CheckCircle}
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Verified Physicians"
                    value={stats.verified_physicians}
                    description="Currently active"
                    icon={UserCheck}
                    iconColor="text-green-600"
                />
            </div>

            {/* Applications Section */}
            <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-1">Applications</h2>
                <p className="text-sm text-gray-500 mb-4">Review and approve hospital and physician applications</p>

                {/* Tabs with Search */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="hospitals">
                                Hospitals ({mockHospitals.length})
                            </TabsTrigger>
                            <TabsTrigger value="physicians">
                                Physicians ({mockPhysicianApplications.length})
                            </TabsTrigger>
                        </TabsList>

                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search applications..."
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
