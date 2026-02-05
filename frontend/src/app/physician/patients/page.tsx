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
import { Search, Eye, Plus } from 'lucide-react';

export default function PatientsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter patients based on search
    const filteredPatients = mockPatients.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getNHISBadge = (status: string) => {
        const styles = {
            Active: 'bg-green-100 text-green-700 border-green-200',
            Expired: 'bg-amber-100 text-amber-700 border-amber-200',
            None: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return styles[status as keyof typeof styles] || styles.None;
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
                                <TableHead>Name</TableHead>
                                <TableHead>Age</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead>Diagnosis</TableHead>
                                <TableHead>NHIS Status</TableHead>
                                <TableHead>Last Visit</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPatients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                        No patients found matching your search
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <TableRow key={patient.id}>
                                        <TableCell className="font-medium">{patient.name}</TableCell>
                                        <TableCell>{patient.age}</TableCell>
                                        <TableCell>{patient.gender}</TableCell>
                                        <TableCell className="text-blue-600">{patient.diagnosis}</TableCell>
                                        <TableCell>
                                            <Badge className={getNHISBadge(patient.nhis_status)} variant="outline">
                                                {patient.nhis_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(patient.last_visit)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" className="text-gray-600">
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
        </div>
    );
}
