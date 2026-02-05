'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/stats-card';
import { HospitalReferralsTable } from '@/components/hospital/referrals-table';
import { ResourcesTab } from '@/components/hospital/resources-tab';
import { SpecialistsTab } from '@/components/hospital/specialists-tab';
import { mockHospitalStats, mockReferrals, mockResources, mockSpecialists } from '@/lib/mock-data';
import { Bed, Heart, Users, Clock } from 'lucide-react';

export default function HospitalDashboard() {
    const [activeTab, setActiveTab] = useState('referrals');
    const stats = mockHospitalStats;

    // Filter referrals for this hospital
    const hospitalReferrals = mockReferrals.filter(r => r.hospital_id === 'hosp-1');
    const pendingReferrals = hospitalReferrals.filter(r => r.status === 'Pending');

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Hospital Dashboard</h1>
                <p className="text-gray-500">City General Hospital - Resource and Referral Management</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title="Total Beds"
                    value={stats.total_beds}
                    description={`${stats.available_beds} available`}
                    icon={Bed}
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="ICU Capacity"
                    value={stats.icu_available}
                    description={`of ${stats.icu_capacity} available`}
                    icon={Heart}
                    iconColor="text-red-500"
                />
                <StatsCard
                    title="Specialists Available"
                    value={stats.specialists_available}
                    description={`of ${stats.specialists_total} total`}
                    icon={Users}
                    iconColor="text-purple-600"
                />
                <StatsCard
                    title="Pending Referrals"
                    value={pendingReferrals.length}
                    description="Awaiting response"
                    icon={Clock}
                    iconColor="text-amber-600"
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="referrals">
                        Referrals ({hospitalReferrals.length})
                    </TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                    <TabsTrigger value="specialists">Specialists</TabsTrigger>
                </TabsList>

                <TabsContent value="referrals" className="mt-4">
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-lg font-semibold mb-1">Patient Referrals</h2>
                        <p className="text-sm text-gray-500 mb-4">Review and manage incoming patient referrals</p>
                        <HospitalReferralsTable referrals={hospitalReferrals} />
                    </div>
                </TabsContent>

                <TabsContent value="resources" className="mt-4">
                    <ResourcesTab resources={mockResources} />
                </TabsContent>

                <TabsContent value="specialists" className="mt-4">
                    <SpecialistsTab specialists={mockSpecialists} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
