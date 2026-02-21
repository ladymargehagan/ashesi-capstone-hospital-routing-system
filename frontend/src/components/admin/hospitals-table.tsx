'use client';

import { useState } from 'react';
import { Hospital } from '@/types';
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
import { HospitalDetailsModal } from '@/components/admin/hospital-details-modal';
import { Eye, Check, X } from 'lucide-react';

interface HospitalsTableProps {
    hospitals: Hospital[];
}

export function HospitalsTable({ hospitals }: HospitalsTableProps) {
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-700',
            active: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
        };
        return styles[status] || styles.pending;
    };

    const handleQuickAction = async (hospital: Hospital, action: 'approve' | 'reject') => {
        // Simulate API call
        alert(`Hospital ${action}d successfully!`);
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Hospital Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact Phone</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {hospitals.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                No hospitals found
                            </TableCell>
                        </TableRow>
                    ) : (
                        hospitals.map((hospital) => (
                            <TableRow key={hospital.id}>
                                <TableCell className="font-medium">{hospital.name}</TableCell>
                                <TableCell>{hospital.type}</TableCell>
                                <TableCell>{hospital.contact_phone || '—'}</TableCell>
                                <TableCell>{hospital.tier.replace('_', ' ').toUpperCase()}</TableCell>
                                <TableCell>{formatDate(hospital.created_at)}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusBadge(hospital.status)}>
                                        {hospital.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedHospital(hospital)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {hospital.status === 'pending' && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleQuickAction(hospital, 'approve')}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleQuickAction(hospital, 'reject')}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <HospitalDetailsModal
                hospital={selectedHospital}
                open={!!selectedHospital}
                onClose={() => setSelectedHospital(null)}
            />
        </>
    );
}
