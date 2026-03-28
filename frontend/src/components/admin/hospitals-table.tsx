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
import { Button } from '@/components/ui/button';
import { hospitalsApi } from '@/lib/api-client';
import { useState } from 'react';
import { Loader2, Power, PowerOff } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

interface HospitalsTableProps {
    hospitals: Hospital[];
    onStatusChanged?: () => void;
}

export function HospitalsTable({ hospitals, onStatusChanged }: HospitalsTableProps) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const toast = useToast();

    const toggleStatus = async (hospitalId: string, currentStatus: string) => {
        setActionLoading(hospitalId);
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await hospitalsApi.updateStatus(hospitalId, newStatus);
            onStatusChanged?.();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update hospital status');
        } finally {
            setActionLoading(null);
        }
    };
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
                    <TableHead className="text-right">Actions</TableHead>
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
                                <Badge className={hospital.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                    {hospital.status.toUpperCase()}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {actionLoading === hospital.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin inline text-gray-400" />
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={hospital.status === 'active' ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                                        onClick={() => toggleStatus(hospital.id, hospital.status)}
                                    >
                                        {hospital.status === 'active' ? <PowerOff className="h-4 w-4 mr-1" /> : <Power className="h-4 w-4 mr-1" />}
                                        {hospital.status === 'active' ? 'Deactivate' : 'Activate'}
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
