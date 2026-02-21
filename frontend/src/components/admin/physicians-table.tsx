'use client';

import { User } from '@/types';
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
    physicians: User[];
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

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Joined</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {physicians.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No physicians found
                        </TableCell>
                    </TableRow>
                ) : (
                    physicians.map((physician) => (
                        <TableRow key={physician.id}>
                            <TableCell className="font-medium">{physician.name}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">
                                    {physician.specialty || '-'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">{physician.license_number || '-'}</TableCell>
                            <TableCell>{getHospitalName(physician.hospital_id)}</TableCell>
                            <TableCell>
                                {physician.years_of_experience
                                    ? `${physician.years_of_experience} years`
                                    : '-'}
                            </TableCell>
                            <TableCell className="text-gray-600">{formatDate(physician.created_at)}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
