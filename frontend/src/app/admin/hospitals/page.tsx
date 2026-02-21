'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { StatsCard } from '@/components/stats-card';
import { HospitalsTable } from '@/components/admin/hospitals-table';
import { hospitalsApi } from '@/lib/api-client';
import { Hospital } from '@/types';
import { Building2, CheckCircle, Clock, Search, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HospitalsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        hospitalsApi.list()
            .then((data) => setHospitals(data as unknown as Hospital[]))
            .catch((err) => console.error('Failed to load hospitals:', err))
            .finally(() => setLoading(false));
    }, []);

    const pendingHospitals = hospitals.filter(h => h.status === 'pending');
    const activeHospitals = hospitals.filter(h => h.status === 'active');

    const getFilteredHospitals = () => {
        let list = hospitals;
        if (statusFilter === 'pending') list = pendingHospitals;
        if (statusFilter === 'active') list = activeHospitals;

        if (searchQuery) {
            list = list.filter(h =>
                h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                h.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                h.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return list;
    };

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
                <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
                <p className="text-gray-500">Manage and review hospital applications</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatsCard
                    title="Total Hospitals"
                    value={hospitals.length}
                    description="All registered hospitals"
                    icon={Building2}
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Pending Approval"
                    value={pendingHospitals.length}
                    description="Awaiting review"
                    icon={Clock}
                    iconColor="text-amber-600"
                />
                <StatsCard
                    title="Active"
                    value={activeHospitals.length}
                    description="Currently active"
                    icon={CheckCircle}
                    iconColor="text-green-600"
                />
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg border p-6">
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="all">
                                All ({hospitals.length})
                            </TabsTrigger>
                            <TabsTrigger value="pending">
                                Pending ({pendingHospitals.length})
                            </TabsTrigger>
                            <TabsTrigger value="active">
                                Active ({activeHospitals.length})
                            </TabsTrigger>
                        </TabsList>

                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search hospitals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <TabsContent value="all" className="mt-0">
                        <HospitalsTable hospitals={getFilteredHospitals()} />
                    </TabsContent>
                    <TabsContent value="pending" className="mt-0">
                        <HospitalsTable hospitals={getFilteredHospitals()} />
                    </TabsContent>
                    <TabsContent value="active" className="mt-0">
                        <HospitalsTable hospitals={getFilteredHospitals()} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
