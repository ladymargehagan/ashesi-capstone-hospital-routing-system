'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { referralsApi } from '@/lib/api-client';
import { Referral } from '@/types';
import { Search, Plus, Loader2 } from 'lucide-react';

export default function ReferralsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        referralsApi.list()
            .then((data) => setReferrals(data as unknown as Referral[]))
            .catch((err) => console.error('Failed to load referrals:', err))
            .finally(() => setLoading(false));
    }, []);

    // Apply filters
    const filteredReferrals = referrals.filter(referral => {
        const matchesSearch =
            (referral.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (referral.receiving_hospital_name || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
        const matchesSeverity = severityFilter === 'all' || referral.severity === severityFilter;

        return matchesSearch && matchesStatus && matchesSeverity;
    });

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSeverityBadge = (severity: string) => {
        const styles: Record<string, string> = {
            critical: 'bg-red-100 text-red-700 border-red-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            medium: 'bg-amber-100 text-amber-700 border-amber-200',
            low: 'bg-green-100 text-green-700 border-green-200',
        };
        return styles[severity] || styles.low;
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
            en_route: 'bg-blue-100 text-blue-700',
            completed: 'bg-gray-100 text-gray-700',
        };
        return styles[status] || styles.pending;
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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
                    <p className="text-gray-500">Track and manage your patient referrals</p>
                </div>
                <Link href="/physician/referral">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Referral
                    </Button>
                </Link>
            </div>

            {/* Referrals Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">All Referrals</CardTitle>
                            <CardDescription>{filteredReferrals.length} referrals found</CardDescription>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-4 mt-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search referrals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="en_route">En Route</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={severityFilter} onValueChange={setSeverityFilter}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severity</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient</TableHead>
                                <TableHead>Receiving Hospital</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Stability</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReferrals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                        No referrals found matching your criteria
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReferrals.map((referral) => (
                                    <TableRow key={referral.id}>
                                        <TableCell className="font-medium">{referral.patient_name}</TableCell>
                                        <TableCell>{referral.receiving_hospital_name}</TableCell>
                                        <TableCell>
                                            <Badge className={getSeverityBadge(referral.severity)} variant="outline">
                                                {referral.severity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={referral.stability === 'stable' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}
                                                variant="outline"
                                            >
                                                {referral.stability}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDateTime(referral.submitted_at)}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusBadge(referral.status)}>
                                                {referral.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
