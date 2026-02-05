'use client';

import Link from 'next/link';
import { Patient } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, FileText } from 'lucide-react';

interface PatientsTableProps {
    patients: Patient[];
}

export function PatientsTable({ patients }: PatientsTableProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {patients.map((patient) => (
                    <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell>{patient.gender}</TableCell>
                        <TableCell className="text-blue-600">{patient.diagnosis}</TableCell>
                        <TableCell>{formatDate(patient.last_visit)}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="text-gray-600">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Link href={`/physician/referral?patient=${patient.id}`}>
                                    <Button variant="ghost" size="sm" className="text-gray-600">
                                        Refer
                                    </Button>
                                </Link>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
