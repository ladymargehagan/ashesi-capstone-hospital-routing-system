'use client';

import { useState } from 'react';
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
import { PatientDetailsModal } from '@/components/physician/patient-details-modal';

interface PatientsTableProps {
    patients: Patient[];
}

export function PatientsTable({ patients }: PatientsTableProps) {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getAge = (dob?: string) => {
        if (!dob) return '-';
        const today = new Date();
        const birth = new Date(dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Sex</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {patients.map((patient) => (
                        <TableRow key={patient.id}>
                            <TableCell className="font-medium">{patient.full_name}</TableCell>
                            <TableCell>{getAge(patient.date_of_birth)}</TableCell>
                            <TableCell className="capitalize">{patient.sex || '-'}</TableCell>
                            <TableCell className="text-blue-600">{patient.diagnosis || '-'}</TableCell>
                            <TableCell>{formatDate(patient.last_visit)}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-600 hover:text-blue-600"
                                        onClick={() => setSelectedPatient(patient)}
                                    >
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

            <PatientDetailsModal
                patient={selectedPatient}
                open={!!selectedPatient}
                onClose={() => setSelectedPatient(null)}
            />
        </>
    );
}
