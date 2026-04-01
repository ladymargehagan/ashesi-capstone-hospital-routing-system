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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usersApi } from '@/lib/api-client';
import { Check, X, Loader2, Search } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

interface HospitalPhysiciansTabProps {
    physicians: Physician[];
    onStatusChanged?: () => void;
}

export function HospitalPhysiciansTab({ physicians, onStatusChanged }: HospitalPhysiciansTabProps) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const toast = useToast();
    const [nameFilter, setNameFilter] = useState('');
    const [specFilter, setSpecFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

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
            toast.success(`Dr. ${physician.full_name || physician.email} has been ${action === 'approve' ? 'approved' : 'rejected'}`);
            onStatusChanged?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : `Failed to ${action} physician`);
        } finally {
            setActionLoading(null);
        }
    };

    // Sort: pending first, then active, then rejected
    const sorted = [...physicians].sort((a, b) => {
        const order: Record<string, number> = { pending: 0, active: 1, rejected: 2 };
        return (order[a.status] ?? 1) - (order[b.status] ?? 1);
    });

    const filtered = sorted.filter(p => {
        const matchesName = !nameFilter ||
            (p.full_name || p.email || '').toLowerCase().includes(nameFilter.toLowerCase()) ||
            p.license_number.toLowerCase().includes(nameFilter.toLowerCase());

        const matchesSpec = specFilter === 'all' || p.specialization === specFilter;
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchesName && matchesSpec && matchesStatus;
    });

    const uniqueSpecs = Array.from(new Set(physicians.map(p => p.specialization).filter(Boolean))) as string[];
    const pendingCount = physicians.filter(p => p.status === 'pending').length;

    return (
        <div className="space-y-4">
            {pendingCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-800">
                    <span className="font-semibold">{pendingCount} pending</span>
                    <span>physician{pendingCount !== 1 ? 's' : ''} awaiting your approval</span>
                </div>
            )}

            <div className="flex flex-wrap gap-3 pb-4 border-b">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name or license..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={specFilter} onValueChange={setSpecFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Specialization" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Specializations</SelectItem>
                        {uniqueSpecs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>License #</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Rank</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                                No physicians found
                            </TableCell>
                        </TableRow>
                    ) : (
                        filtered.map((physician) => (
                            <TableRow key={physician.id} className={physician.status === 'pending' ? 'bg-amber-50/40' : ''}>
                                <TableCell className="font-medium">
                                    {physician.title ? `${physician.title} ` : ''}{physician.full_name || physician.email || '—'}
                                </TableCell>
                                <TableCell className="font-mono text-sm">{physician.license_number}</TableCell>
                                <TableCell>
                                    {physician.specialization ? (
                                        <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">
                                            {physician.specialization}
                                        </Badge>
                                    ) : '—'}
                                </TableCell>
                                <TableCell className="text-gray-600">{physician.department || '—'}</TableCell>
                                <TableCell className="text-gray-600">{physician.grade || '—'}</TableCell>
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
        </div>
    );
}
