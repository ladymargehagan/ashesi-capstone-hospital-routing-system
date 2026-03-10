'use client';

import { useState } from 'react';
import { Physician } from '@/types';
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
import { usersApi } from '@/lib/api-client';
import { Check, X, Loader2 } from 'lucide-react';

interface PhysiciansTableProps {
    physicians: Physician[];
    onStatusChanged?: () => void;
}

export function PhysiciansTable({ physicians, onStatusChanged }: PhysiciansTableProps) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            pending: 'bg-amber-100 text-amber-700',
            rejected: 'bg-red-100 text-red-700',
        };
        return styles[status] || styles.pending;
    };

    const handleAction = async (physician: Physician, action: 'approve' | 'reject') => {
        if (!physician.user_id) return;
        setActionLoading(physician.id);
        try {
            const status = action === 'approve' ? 'active' : 'rejected';
            await usersApi.updateStatus(physician.user_id, status);
            onStatusChanged?.();
        } catch (err) {
            alert(err instanceof Error ? err.message : `Failed to ${action} physician`);
        } finally {
            setActionLoading(null);
        }
    };

    // Sort: pending first, then active, then rejected
    const sorted = [...physicians].sort((a, b) => {
        const order: Record<string, number> = { pending: 0, active: 1, rejected: 2 };
        return (order[a.status] ?? 1) - (order[b.status] ?? 1);
    });

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>License #</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sorted.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                            No physicians found
                        </TableCell>
                    </TableRow>
                ) : (
                    sorted.map((physician) => (
                        <TableRow key={physician.id} className={physician.status === 'pending' ? 'bg-amber-50/40' : ''}>
                            <TableCell className="font-medium">
                                {physician.title ? `${physician.title} ` : ''}{physician.full_name || physician.email || '—'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{physician.license_number}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">
                                    {physician.specialization || '—'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">{physician.hospital_name || 'Unaffiliated'}</TableCell>
                            <TableCell>
                                <Badge className={getStatusBadge(physician.status)}>
                                    {physician.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm">{formatDate(physician.created_at)}</TableCell>
                            <TableCell>
                                {actionLoading === physician.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                ) : physician.status === 'pending' ? (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => handleAction(physician, 'approve')}
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleAction(physician, 'reject')}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
