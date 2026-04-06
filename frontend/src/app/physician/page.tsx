'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/stats-card';
import { PatientsTable } from '@/components/physician/patients-table';
import { ReferralOutcomesChart } from '@/components/physician/referral-outcomes-chart';
import { ReferralsTable } from '@/components/physician/referrals-table';
import { useAuth } from '@/hooks/use-auth';
import { patientsApi, referralsApi, usersApi } from '@/lib/api-client';
import { Patient, Referral } from '@/types';
import { Users, Clock, CheckCircle, FileText, Plus, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function PhysicianDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('patients');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [outgoingReferrals, setOutgoingReferrals] = useState<Referral[]>([]);
    const [incomingReferrals, setIncomingReferrals] = useState<Referral[]>([]);
    const [stats, setStats] = useState({ total_patients: 0, total_referrals: 0, pending_referrals: 0, incoming_active: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        try {
            const physicianId = user?.physician_id || undefined;
            const [patientsRes, allReferralsRes] = await Promise.all([
                patientsApi.list(physicianId).catch(() => []),
                physicianId
                    ? referralsApi.list({ physician_id: physicianId }).catch(() => [])
                    : Promise.resolve([]),
            ]);

            const allReferrals = allReferralsRes as unknown as Referral[];
            // Outgoing = referrals THIS physician created
            const outgoing = allReferrals.filter(r => r.referring_physician_id === physicianId);
            // Incoming = referrals assigned TO this physician from another hospital
            const incoming = allReferrals.filter(r => r.assigned_physician_id === physicianId);

            setPatients(patientsRes as unknown as Patient[]);
            setOutgoingReferrals(outgoing);
            setIncomingReferrals(incoming);

            setStats({
                total_patients: patientsRes.length,
                total_referrals: outgoing.length,
                pending_referrals: outgoing.filter(r => r.status === 'pending').length,
                incoming_active: incoming.filter(r => ['approved', 'in_transit', 'arrived'].includes(r.status)).length,
            });
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.physician_id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Physician Dashboard</h1>
                    <p className="text-gray-500">{user?.full_name}</p>
                </div>
                <Link href="/physician/referral?voice=1">
                    <Button className="bg-primary hover:bg-secondary">
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
                    iconColor="text-primary"
                />
                <StatsCard
                    title="Pending Referrals"
                    value={stats.pending_referrals}
                    description="Awaiting response"
                    icon={Clock}
                    iconColor="text-amber-600"
                />
                <StatsCard
                    title="Incoming Active"
                    value={stats.incoming_active}
                    description="Patients en route to you"
                    icon={ArrowDownLeft}
                    iconColor="text-purple-600"
                />
                <StatsCard
                    title="Outgoing Referrals"
                    value={stats.total_referrals}
                    description="All time"
                    icon={FileText}
                    iconColor="text-green-600"
                />
            </div>

            {/* Outcomes Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-sm font-semibold mb-4 text-gray-800 flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-primary" />
                        Outcomes (Sent Referrals)
                    </h3>
                    <ReferralOutcomesChart referrals={outgoingReferrals} />
                </div>
                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-sm font-semibold mb-4 text-gray-800 flex items-center gap-2">
                        <ArrowDownLeft className="h-4 w-4 text-purple-600" />
                        Outcomes (Received Referrals)
                    </h3>
                    <ReferralOutcomesChart referrals={incomingReferrals} />
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="patients">
                        <Users className="h-4 w-4 mr-1.5" />
                        Patients
                    </TabsTrigger>
                    <TabsTrigger value="outgoing">
                        <ArrowUpRight className="h-4 w-4 mr-1.5" />
                        Referrals Sent
                        {outgoingReferrals.length > 0 && (
                            <Badge className="ml-2 bg-primary/10 text-secondary text-xs">{outgoingReferrals.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="incoming">
                        <ArrowDownLeft className="h-4 w-4 mr-1.5" />
                        Assigned to Me
                        {incomingReferrals.length > 0 && (
                            <Badge className="ml-2 bg-purple-100 text-purple-700 text-xs">{incomingReferrals.length}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="patients" className="mt-4">
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-lg font-semibold mb-1">Your Patients</h2>
                        <p className="text-sm text-gray-500 mb-4">Manage your active patients</p>
                        <PatientsTable patients={patients} />
                    </div>
                </TabsContent>

                <TabsContent value="outgoing" className="mt-4">
                    <div className="bg-white rounded-lg border p-6">
                        <div className="flex items-center gap-2 mb-1">
                            <ArrowUpRight className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">Referrals You Sent</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Track patients you have referred to other hospitals. Click a row to dispatch, update, or flag data.
                        </p>
                        <ReferralsTable referrals={outgoingReferrals} onStatusChanged={fetchData} />
                    </div>
                </TabsContent>

                <TabsContent value="incoming" className="mt-4">
                    <div className="bg-white rounded-lg border p-6">
                        <div className="flex items-center gap-2 mb-1">
                            <ArrowDownLeft className="h-5 w-5 text-purple-600" />
                            <h2 className="text-lg font-semibold">Patients Assigned to You</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Incoming patients referred from other hospitals and assigned to your care. Click to view live updates and mark arrival or completion.
                        </p>
                        {incomingReferrals.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <ArrowDownLeft className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No patients assigned to you yet</p>
                                <p className="text-sm mt-1">When a hospital admin assigns a referral to you, it will appear here.</p>
                            </div>
                        ) : (
                            <ReferralsTable referrals={incomingReferrals} onStatusChanged={fetchData} />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
