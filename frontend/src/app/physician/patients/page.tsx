'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { mockPatients } from '@/lib/mock-data';
import { Patient } from '@/types';
import { PatientDetailsModal } from '@/components/physician/patient-details-modal';
import { Search, Eye, Plus } from 'lucide-react';

export default function PatientsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const filteredPatients = mockPatients.filter(patient =>
        patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (patient.diagnosis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.patient_identifier.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    const getNHISBadge = (status?: string) => {
        if (!status) return 'bg-gray-100 text-gray-700 border-gray-200';
        const styles: Record<string, string> = {
            Active: 'bg-green-100 text-green-700 border-green-200',
            Expired: 'bg-amber-100 text-amber-700 border-amber-200',
            None: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return styles[status] || styles.None;
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
                    <p className="text-gray-500">View and manage your patient records</p>
                </div>
                <Link href="/physician/referral">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Referral
                    </Button>
                </Link>
            </div>

            {/* Patient List Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">All Patients</CardTitle>
                            <CardDescription>{filteredPatients.length} patients found</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search patients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Age</TableHead>
                                <TableHead>Sex</TableHead>
                                <TableHead>Diagnosis</TableHead>
                                <TableHead>NHIS Status</TableHead>
                                <TableHead>Last Visit</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPatients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                                        No patients found matching your search
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <TableRow key={patient.id}>
                                        <TableCell className="text-gray-500 text-sm">{patient.patient_identifier}</TableCell>
                                        <TableCell className="font-medium">{patient.full_name}</TableCell>
                                        <TableCell>{getAge(patient.date_of_birth)}</TableCell>
                                        <TableCell className="capitalize">{patient.sex || '-'}</TableCell>
                                        <TableCell className="text-blue-600">{patient.diagnosis || '-'}</TableCell>
                                        <TableCell>
                                            <Badge className={getNHISBadge(patient.nhis_status)} variant="outline">
                                                {patient.nhis_status || 'None'}
                                            </Badge>
                                        </TableCell>
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
                                                    <Button variant="outline" size="sm">
                                                        Refer
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <PatientDetailsModal
                patient={selectedPatient}
                open={!!selectedPatient}
                onClose={() => setSelectedPatient(null)}
            />
        </div>
    );
}
