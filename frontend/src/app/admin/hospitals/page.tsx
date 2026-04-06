'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { StatsCard } from '@/components/stats-card';
import { HospitalsTable } from '@/components/admin/hospitals-table';
import { hospitalsApi } from '@/lib/api-client';
import { Hospital } from '@/types';
import { Building2, CheckCircle, Search, Loader2, Plus, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InviteAdminModal } from '@/components/admin/invite-admin-modal';
import { AddHospitalModal } from '@/components/admin/add-hospital-modal';

export default function HospitalsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchHospitals = useCallback(() => {
        hospitalsApi.list()
            .then((data) => setHospitals(data as unknown as Hospital[]))
            .catch((err) => console.error('Failed to load hospitals:', err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchHospitals();
    }, [fetchHospitals]);

    const activeHospitals = hospitals.filter(h => h.status === 'active');
    const inactiveHospitals = hospitals.filter(h => h.status === 'inactive');

    const getFilteredHospitals = () => {
        let list = hospitals;
        if (statusFilter === 'active') list = activeHospitals;
        if (statusFilter === 'inactive') list = inactiveHospitals;

        if (searchQuery) {
            list = list.filter(h =>
                h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (h.level || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                h.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return list;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
                    <p className="text-gray-500">Manage hospitals in the network</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsInviteModalOpen(true)}
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Hospital Admin
                    </Button>
                    <Button
                        className="bg-primary hover:bg-secondary text-white"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Hospital
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatsCard
                    title="Total Hospitals"
                    value={hospitals.length}
                    description="All registered hospitals"
                    icon={Building2}
                    iconColor="text-primary"
                />
                <StatsCard
                    title="Active"
                    value={activeHospitals.length}
                    description="Currently active"
                    icon={CheckCircle}
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Inactive"
                    value={inactiveHospitals.length}
                    description="Pending setup or deactivated"
                    icon={AlertCircle}
                    iconColor="text-amber-600"
                />
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {(['all', 'active', 'inactive'] as const).map((filter) => (
                            <Button
                                key={filter}
                                variant={statusFilter === filter ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setStatusFilter(filter)}
                                className={statusFilter === filter ? 'bg-primary text-white' : ''}
                            >
                                {filter === 'all' ? `All (${hospitals.length})` :
                                 filter === 'active' ? `Active (${activeHospitals.length})` :
                                 `Inactive (${inactiveHospitals.length})`}
                            </Button>
                        ))}
                    </div>

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

                <HospitalsTable hospitals={getFilteredHospitals()} onStatusChanged={fetchHospitals} />
            </div>

            <InviteAdminModal
                open={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                hospitals={hospitals}
            />

            <AddHospitalModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdded={fetchHospitals}
            />
        </div>
    );
}
