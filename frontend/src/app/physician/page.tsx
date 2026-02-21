'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/stats-card';
import { PatientsTable } from '@/components/physician/patients-table';
import { ReferralsTable } from '@/components/physician/referrals-table';
import { useAuth } from '@/hooks/use-auth';
import { patientsApi, referralsApi, statsApi } from '@/lib/api-client';
import { Patient, Referral } from '@/types';
import { Users, Clock, CheckCircle, FileText, Plus, Loader2 } from 'lucide-react';

export default function PhysicianDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('patients');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [stats, setStats] = useState({ total_patients: 0, total_referrals: 0, pending_referrals: 0, completed_referrals: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const fetchData = async () => {
            try {
                // We need the physician_id, but the user might only have user_id
                // The backend expects physician_id — for now use hospital_id context
                const [patientsRes, referralsRes] = await Promise.all([
                    patientsApi.list().catch(() => []),
                    referralsApi.list().catch(() => []),
                ]);
                setPatients(patientsRes as unknown as Patient[]);
                setReferrals(referralsRes as unknown as Referral[]);

                const pending = (referralsRes as Array<Record<string, unknown>>).filter(
                    (r) => r.status === 'pending'
                ).length;
                const completed = (referralsRes as Array<Record<string, unknown>>).filter(
                    (r) => r.status === 'completed'
                ).length;

                setStats({
                    total_patients: patientsRes.length,
                    total_referrals: referralsRes.length,
                    pending_referrals: pending,
                    completed_referrals: completed,
                });
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id]);

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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Physician Dashboard</h1>
                    <p className="text-gray-500">{user?.full_name}</p>
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
                    value={stats.total_patients}
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
                    title="Completed Referrals"
                    value={stats.completed_referrals}
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
                        Referrals ({referrals.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="patients" className="mt-4">
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-lg font-semibold mb-1">Patient List</h2>
                        <p className="text-sm text-gray-500 mb-4">Manage your active patients</p>
                        <PatientsTable patients={patients} />
                    </div>
                </TabsContent>

                <TabsContent value="referrals" className="mt-4">
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-lg font-semibold mb-1">Your Referrals</h2>
                        <p className="text-sm text-gray-500 mb-4">Track your patient referrals</p>
                        <ReferralsTable referrals={referrals} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
