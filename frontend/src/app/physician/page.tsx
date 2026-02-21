'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/stats-card';
import { PatientsTable } from '@/components/physician/patients-table';
import { ReferralsTable } from '@/components/physician/referrals-table';
import { mockPhysicianStats, mockPatients, mockReferrals } from '@/lib/mock-data';
import { Users, Clock, CheckCircle, FileText, Plus } from 'lucide-react';

export default function PhysicianDashboard() {
    const [activeTab, setActiveTab] = useState('patients');
    const stats = mockPhysicianStats;

    // Filter referrals for this physician
    const physicianReferrals = mockReferrals.filter(r => r.referring_physician_id === 'phys-1');

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Physician Dashboard</h1>
                    <p className="text-gray-500">Dr. Sarah Johnson - Downtown Medical Clinic</p>
                </div>
                <Link href="/physician/referral">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Referral
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title="Active Patients"
                    value={stats.active_patients}
                    description="In your care"
                    icon={Users}
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Pending Referrals"
                    value={stats.pending_referrals}
                    description="Awaiting response"
                    icon={Clock}
                    iconColor="text-amber-600"
                />
                <StatsCard
                    title="Accepted Referrals"
                    value={stats.accepted_referrals}
                    description="This month"
                    icon={CheckCircle}
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Total Referrals"
                    value={stats.total_referrals}
                    description="All time"
                    icon={FileText}
                    iconColor="text-purple-600"
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="patients">Patients</TabsTrigger>
                    <TabsTrigger value="referrals">
                        Referrals ({physicianReferrals.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="patients" className="mt-4">
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-lg font-semibold mb-1">Patient List</h2>
                        <p className="text-sm text-gray-500 mb-4">Manage your active patients</p>
                        <PatientsTable patients={mockPatients} />
                    </div>
                </TabsContent>

                <TabsContent value="referrals" className="mt-4">
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-lg font-semibold mb-1">Your Referrals</h2>
                        <p className="text-sm text-gray-500 mb-4">Track your patient referrals</p>
                        <ReferralsTable referrals={physicianReferrals} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
