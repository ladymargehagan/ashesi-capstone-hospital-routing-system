'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { StatsCard } from '@/components/stats-card';
import { Badge } from '@/components/ui/badge';
import { mockPhysicianApplications, mockHospitals } from '@/lib/mock-data';
import { Users, Stethoscope, Search } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function PhysiciansPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const physicians = mockPhysicianApplications;

    const filteredPhysicians = physicians.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.specialty?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.license_number?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const getHospitalName = (hospitalId?: string) => {
        if (!hospitalId) return 'Unaffiliated';
        const hospital = mockHospitals.find(h => h.id === hospitalId);
        return hospital?.name || 'Unknown';
    };

    const uniqueSpecialties = new Set(physicians.map(p => p.specialty).filter(Boolean));

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Physicians</h1>
                <p className="text-gray-500">Directory of physicians across onboarded hospitals</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatsCard
                    title="Total Physicians"
                    value={physicians.length}
                    description="Across all hospitals"
                    icon={Users}
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Specialties"
                    value={uniqueSpecialties.size}
                    description="Different specializations"
                    icon={Stethoscope}
                    iconColor="text-purple-600"
                />
                <StatsCard
                    title="Affiliated"
                    value={physicians.filter(p => p.hospital_id).length}
                    description="Linked to a hospital"
                    icon={Users}
                    iconColor="text-green-600"
                />
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold">Physician Directory</h2>
                        <p className="text-sm text-gray-500">
                            Physicians are automatically listed when their hospital is onboarded
                        </p>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search physicians..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

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
                        {filteredPhysicians.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                    No physicians found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPhysicians.map((physician) => (
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
                                    <TableCell className="text-gray-600">
                                        {new Date(physician.created_at).toLocaleDateString('en-US', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
