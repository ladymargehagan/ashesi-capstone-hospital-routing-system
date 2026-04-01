'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReferralsTable } from '@/components/physician/referrals-table';
import { referralsApi } from '@/lib/api-client';
import { Referral } from '@/types';
import { Search, Plus, Loader2, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ReferralOutcomesChart } from '@/components/physician/referral-outcomes-chart';
import { StatsCard } from '@/components/stats-card';

export default function ReferralsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('outgoing');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [outgoing, setOutgoing] = useState<Referral[]>([]);
    const [incoming, setIncoming] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReferrals = useCallback(() => {
        if (!user?.physician_id) return;
        referralsApi.list({ physician_id: user.physician_id })
            .then((data) => {
                const all = data as unknown as Referral[];
                setOutgoing(all.filter(r => r.referring_physician_id === user.physician_id));
                setIncoming(all.filter(r => r.assigned_physician_id === user.physician_id));
            })
            .catch((err) => console.error('Failed to load referrals:', err))
            .finally(() => setLoading(false));
    }, [user?.physician_id]);

    useEffect(() => {
        fetchReferrals();
    }, [fetchReferrals]);

    const applyFilters = (referrals: Referral[]) => referrals.filter(referral => {
        const matchesSearch =
            (referral.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (referral.receiving_hospital_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (referral.referring_hospital_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredOutgoing = applyFilters(outgoing);
    const filteredIncoming = applyFilters(incoming);

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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
                    <p className="text-gray-500">Track outgoing referrals and manage patients assigned to you</p>
                </div>
                <Link href="/physician/referral">
                    <Button className="bg-primary hover:bg-secondary">
                        <Plus className="h-4 w-4 mr-2" />
                        New Referral
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by patient or hospital..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="arrived">Arrived</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title="Pending"
                    value={outgoing.filter(r => r.status === 'pending').length}
                    description="Awaiting response"
                    icon={Clock}
                    iconColor="text-amber-600"
                />
                <StatsCard
                    title="In Transit"
                    value={outgoing.filter(r => r.status === 'in_transit').length}
                    description="Patients en route"
                    icon={Truck}
                    iconColor="text-primary"
                />
                <StatsCard
                    title="Completed"
                    value={outgoing.filter(r => r.status === 'completed').length}
                    description="Successfully completed"
                    icon={CheckCircle}
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Rejected / Cancelled"
                    value={outgoing.filter(r => ['rejected', 'cancelled'].includes(r.status)).length}
                    description="Not fulfilled"
                    icon={XCircle}
                    iconColor="text-red-600"
                />
            </div>

            {/* Outcomes Chart */}
            <div className="mb-6 lg:w-1/2">
                <ReferralOutcomesChart referrals={outgoing} />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="outgoing">
                        <ArrowUpRight className="h-4 w-4 mr-1.5" />
                        Referrals Sent
                        <Badge className="ml-2 bg-primary/10 text-secondary text-xs">{filteredOutgoing.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="incoming">
                        <ArrowDownLeft className="h-4 w-4 mr-1.5" />
                        Assigned to Me
                        <Badge className="ml-2 bg-purple-100 text-purple-700 text-xs">{filteredIncoming.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="outgoing" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Referrals You Sent</CardTitle>
                            <CardDescription>
                                {filteredOutgoing.length} referral{filteredOutgoing.length !== 1 ? 's' : ''} — click a row to dispatch or update patient status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ReferralsTable referrals={filteredOutgoing} onStatusChanged={fetchReferrals} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="incoming" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Patients Assigned to You</CardTitle>
                            <CardDescription>
                                {filteredIncoming.length} patient{filteredIncoming.length !== 1 ? 's' : ''} — click a row to view live updates, mark arrival, or complete the case
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredIncoming.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <ArrowDownLeft className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No patients assigned to you yet</p>
                                    <p className="text-sm mt-1">When a hospital admin assigns a referral to you, it will appear here.</p>
                                </div>
                            ) : (
                                <ReferralsTable referrals={filteredIncoming} onStatusChanged={fetchReferrals} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
