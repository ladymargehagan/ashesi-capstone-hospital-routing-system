'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { ReferralDetailsModal } from '@/components/hospital/referral-details-modal';
import { Eye } from 'lucide-react';

interface HospitalReferralsTableProps {
    referrals: Referral[];
}

export function HospitalReferralsTable({ referrals }: HospitalReferralsTableProps) {
    const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUrgencyBadge = (urgency: string) => {
        const styles = {
            Emergency: 'bg-red-100 text-red-700 border-red-200',
            Urgent: 'bg-amber-100 text-amber-700 border-amber-200',
            Routine: 'bg-green-100 text-green-700 border-green-200',
        };
        return styles[urgency as keyof typeof styles] || styles.Routine;
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            Pending: 'bg-amber-100 text-amber-700',
            Accepted: 'bg-green-100 text-green-700',
            Rejected: 'bg-red-100 text-red-700',
        };
        return styles[status as keyof typeof styles] || styles.Pending;
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Referring Physician</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {referrals.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                                No referrals found
                            </TableCell>
                        </TableRow>
                    ) : (
                        referrals.map((referral) => (
                            <TableRow key={referral.id}>
                                <TableCell className="font-medium">{referral.patient_name}</TableCell>
                                <TableCell>{referral.patient_age}</TableCell>
                                <TableCell>{referral.condition}</TableCell>
                                <TableCell>
                                    <Badge className={getUrgencyBadge(referral.urgency)} variant="outline">
                                        {referral.urgency}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium text-sm">{referral.referring_physician_name}</p>
                                        <p className="text-xs text-gray-500">{referral.referring_facility}</p>
                                    </div>
                                </TableCell>
                                <TableCell>{formatDateTime(referral.requested_at)}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusBadge(referral.status)}>
                                        {referral.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedReferral(referral)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <ReferralDetailsModal
                referral={selectedReferral}
                open={!!selectedReferral}
                onClose={() => setSelectedReferral(null)}
            />
        </>
    );
}
