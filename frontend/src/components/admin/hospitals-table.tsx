'use client';

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

interface HospitalsTableProps {
    hospitals: Hospital[];
}

export function HospitalsTable({ hospitals }: HospitalsTableProps) {
    const getLevelBadge = (level: string) => {
        const styles: Record<string, string> = {
            teaching: 'bg-purple-100 text-purple-700',
            regional: 'bg-blue-100 text-blue-700',
            district: 'bg-cyan-100 text-cyan-700',
            polyclinic: 'bg-teal-100 text-teal-700',
            health_centre: 'bg-green-100 text-green-700',
            chps: 'bg-slate-100 text-slate-600',
        };
        return styles[level] || styles.district;
    };

    const getOwnershipBadge = (ownership: string) => {
        const styles: Record<string, string> = {
            public: 'bg-emerald-50 text-emerald-700',
            private: 'bg-amber-50 text-amber-700',
            faith_based: 'bg-violet-50 text-violet-700',
            military: 'bg-red-50 text-red-700',
            quasi_government: 'bg-sky-50 text-sky-700',
        };
        return styles[ownership] || styles.public;
    };

    const formatLevel = (level: string) =>
        level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Hospital Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {hospitals.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No hospitals found
                        </TableCell>
                    </TableRow>
                ) : (
                    hospitals.map((hospital) => (
                        <TableRow key={hospital.id}>
                            <TableCell className="font-medium">{hospital.name}</TableCell>
                            <TableCell>
                                <Badge className={getLevelBadge(hospital.level)}>
                                    {formatLevel(hospital.level)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">{formatLevel(hospital.type)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={getOwnershipBadge(hospital.ownership)}>
                                    {formatLevel(hospital.ownership)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm max-w-48 truncate">{hospital.address}</TableCell>
                            <TableCell>
                                <Badge className="bg-green-100 text-green-700">
                                    {hospital.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
