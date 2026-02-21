'use client';

import { Referral } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ReferralsTableProps {
    referrals: Referral[];
}

export function ReferralsTable({ referrals }: ReferralsTableProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
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
            cancelled: 'bg-gray-100 text-gray-500',
        };
        return styles[status] || styles.pending;
    };

    const getStabilityBadge = (stability: string) => {
        return stability === 'stable'
            ? 'bg-green-50 text-green-600 border-green-200'
            : 'bg-red-50 text-red-600 border-red-200';
    };

    return (
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
                {referrals.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No referrals found
                        </TableCell>
                    </TableRow>
                ) : (
                    referrals.map((referral) => (
                        <TableRow key={referral.id}>
                            <TableCell className="font-medium">{referral.patient_name}</TableCell>
                            <TableCell>{referral.receiving_hospital_name}</TableCell>
                            <TableCell>
                                <Badge className={getSeverityBadge(referral.severity)} variant="outline">
                                    {referral.severity}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge className={getStabilityBadge(referral.stability)} variant="outline">
                                    {referral.stability}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDate(referral.submitted_at)}</TableCell>
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
    );
}
