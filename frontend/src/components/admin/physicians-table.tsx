'use client';

import { useState } from 'react';
import { User } from '@/types';
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
import { Eye, Check, X } from 'lucide-react';

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

    const handleQuickAction = async (physician: User, action: 'approve' | 'reject') => {
        // Simulate API call
        alert(`Physician ${action}d successfully!`);
    };

    // For demo, all physicians in the mock are pending
    const getStatus = () => 'Pending';

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {physicians.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                            No physician applications found
                        </TableCell>
                    </TableRow>
                ) : (
                    physicians.map((physician) => (
                        <TableRow key={physician.id}>
                            <TableCell className="font-medium">{physician.name}</TableCell>
                            <TableCell>{physician.specialty || '-'}</TableCell>
                            <TableCell>{physician.license_number || '-'}</TableCell>
                            <TableCell>
                                {physician.hospital_id ? 'Downtown Medical Clinic' : '-'}
                            </TableCell>
                            <TableCell>
                                {physician.years_of_experience
                                    ? `${physician.years_of_experience} years`
                                    : '-'}
                            </TableCell>
                            <TableCell>{formatDate(physician.created_at)}</TableCell>
                            <TableCell>
                                <Badge className="bg-amber-100 text-amber-700">
                                    {getStatus()}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => handleQuickAction(physician, 'approve')}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleQuickAction(physician, 'reject')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
