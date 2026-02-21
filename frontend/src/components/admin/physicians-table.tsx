'use client';

import { Physician } from '@/types';
import { mockHospitals } from '@/lib/mock-data';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PhysiciansTableProps {
    physicians: Physician[];
}

export function PhysiciansTable({ physicians }: PhysiciansTableProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getHospitalName = (hospitalId?: string) => {
        if (!hospitalId) return 'Unaffiliated';
        const hospital = mockHospitals.find(h => h.id === hospitalId);
        return hospital?.name || 'Unknown';
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            pending: 'bg-amber-100 text-amber-700',
            rejected: 'bg-red-100 text-red-700',
        };
        return styles[status] || styles.pending;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>License #</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {physicians.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No physicians found
                        </TableCell>
                    </TableRow>
                ) : (
                    physicians.map((physician) => (
                        <TableRow key={physician.id}>
                            <TableCell className="font-medium">{physician.license_number}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">
                                    {physician.specialization || '-'}
                                </Badge>
                            </TableCell>
                            <TableCell>{getHospitalName(physician.hospital_id)}</TableCell>
                            <TableCell>
                                <Badge className={getStatusBadge(physician.status)}>
                                    {physician.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">{formatDate(physician.created_at)}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
