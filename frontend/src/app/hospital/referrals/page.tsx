'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/stats-card';
import { HospitalReferralsTable } from '@/components/hospital/referrals-table';
import { mockReferrals, mockHospitalStats } from '@/lib/mock-data';
import { Search, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function HospitalReferralsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Filter referrals for this hospital
    const hospitalReferrals = mockReferrals.filter(r => r.receiving_hospital_id === 'hosp-1');

    const filteredReferrals = hospitalReferrals.filter(referral => {
        const matchesSearch = !searchQuery ||
            (referral.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (referral.referring_physician_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = hospitalReferrals.filter(r => r.status === 'pending').length;
    const approvedCount = hospitalReferrals.filter(r => r.status === 'approved').length;
    const rejectedCount = hospitalReferrals.filter(r => r.status === 'rejected').length;

    const statusFilters = [
        { label: 'All', value: 'all', count: hospitalReferrals.length },
        { label: 'Pending', value: 'pending', count: pendingCount },
        { label: 'Approved', value: 'approved', count: approvedCount },
        { label: 'Rejected', value: 'rejected', count: rejectedCount },
    ];

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
                <p className="text-gray-500">Review and manage incoming patient referrals</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatsCard
                    title="Pending Referrals"
                    value={pendingCount}
                    description="Awaiting response"
                    icon={Clock}
                    iconColor="text-amber-600"
                />
                <StatsCard
                    title="Approved"
                    value={approvedCount}
                    description="Accepted referrals"
                    icon={CheckCircle}
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Total Referrals"
                    value={hospitalReferrals.length}
                    description="All referrals"
                    icon={FileText}
                    iconColor="text-blue-600"
                />
            </div>

            {/* Filters & Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Patient Referrals</CardTitle>
                            <CardDescription>{filteredReferrals.length} referrals found</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search referrals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setStatusFilter(filter.value)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === filter.value
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {filter.label} ({filter.count})
                            </button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <HospitalReferralsTable referrals={filteredReferrals} />
                </CardContent>
            </Card>
        </div>
    );
}
