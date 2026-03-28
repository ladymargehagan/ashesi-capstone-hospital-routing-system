'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/stats-card';
import { HospitalReferralsTable } from '@/components/hospital/referrals-table';
import { ResourcesTab } from '@/components/hospital/resources-tab';
import { SpecialistsTab } from '@/components/hospital/specialists-tab';
import { FlagsTab } from '@/components/hospital/flags-tab';
import { useAuth } from '@/hooks/use-auth';
import { referralsApi, resourcesApi, specialistsApi, hospitalsApi, statsApi, healthApi } from '@/lib/api-client';
import { Referral, Resource, Specialist } from '@/types';
import { Bed, Heart, Users, Clock, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function HospitalDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('referrals');
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [flags, setFlags] = useState<any[]>([]);
    const [healthSummary, setHealthSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_beds: 0,
        available_beds: 0,
        icu_capacity: 0,
        icu_available: 0,
        specialists_available: 0,
        specialists_total: 0,
    });

    const fetchData = useCallback(() => {
        if (!user?.hospital_id) return;
        const hospitalId = user.hospital_id;

        Promise.all([
            referralsApi.list({ hospital_id: hospitalId }).catch(() => []),
            resourcesApi.list(hospitalId).catch(() => []),
            specialistsApi.list(hospitalId).catch(() => []),
            hospitalsApi.getFlags(hospitalId.toString()).catch(() => []),
            healthApi.getHospitalSummary(hospitalId.toString()).catch(() => null),
        ]).then(([refs, res, specs, flgs, hSummary]) => {
            setReferrals(refs as unknown as Referral[]);
            setResources(res as unknown as Resource[]);
            setSpecialists(specs as unknown as Specialist[]);
            setFlags(flgs);
            setHealthSummary(hSummary);

            // Compute stats from real data
            const resList = res as unknown as Resource[];
            const generalBeds = resList.find(r => r.resource_type === 'general_beds');
            const icuBeds = resList.find(r => r.resource_type === 'icu_beds');
            setStats({
                total_beds: generalBeds?.total_count || 0,
                available_beds: generalBeds?.available_count || 0,
                icu_capacity: icuBeds?.total_count || 0,
                icu_available: icuBeds?.available_count || 0,
                specialists_total: specs.length,
                specialists_available: (specs as unknown as Specialist[]).filter(
                    s => s.on_call_available
                ).length,
            });
        }).finally(() => setLoading(false));
    }, [user?.hospital_id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pendingReferrals = referrals.filter(r => r.status === 'pending');

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hospital Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage hospital resources and incoming referrals</p>
                </div>
            </div>

            {healthSummary && healthSummary.computed_health !== 'Healthy' && (
                <div className={`p-4 rounded-md border ${healthSummary.computed_health === 'Critical' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    <div className="flex items-center gap-2 font-semibold mb-1">
                        <ShieldAlert className="h-5 w-5" />
                        System Audit Notice: Your Data Health is {healthSummary.computed_health}
                    </div>
                    <p className="text-sm">
                        Please review your data to prevent routing penalties. Issues detected: 
                        <span className="font-medium ml-1">{healthSummary.health_issues.join(', ')}</span>
                    </p>
                </div>
            )}

            {/* Stats Overview */}
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
                        Referrals ({referrals.length})
                    </TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                    <TabsTrigger value="specialists">Specialists</TabsTrigger>
                    {flags.length > 0 && (
                        <TabsTrigger value="flags" className="text-amber-600 font-medium">
                            <AlertTriangle className="h-4 w-4 mr-1.5 inline" />
                            Data Flags
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="referrals" className="mt-4">
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-lg font-semibold mb-1">Patient Referrals</h2>
                        <p className="text-sm text-gray-500 mb-4">Review and manage incoming patient referrals</p>
                        <HospitalReferralsTable referrals={referrals} onStatusChanged={fetchData} />
                    </div>
                </TabsContent>

                <TabsContent value="resources" className="mt-4">
                    <ResourcesTab resources={resources} onResourceUpdated={fetchData} />
                </TabsContent>

                <TabsContent value="specialists" className="mt-4">
                    <SpecialistsTab specialists={specialists} onSpecialistUpdated={fetchData} />
                </TabsContent>

                {flags.length > 0 && (
                    <TabsContent value="flags" className="mt-4">
                        <FlagsTab flags={flags} onFlagResolved={fetchData} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

