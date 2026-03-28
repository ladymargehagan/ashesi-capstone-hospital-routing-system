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

interface PhysiciansTableProps {
    physicians: Physician[];
    onStatusChanged?: () => void;
}

export function PhysiciansTable({ physicians, onStatusChanged }: PhysiciansTableProps) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const toast = useToast();
    const [nameFilter, setNameFilter] = useState('');
    const [hospitalFilter, setHospitalFilter] = useState('all');
    const [specFilter, setSpecFilter] = useState('all');
    const [rankFilter, setRankFilter] = useState('all');

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
            
        const matchesHospital = hospitalFilter === 'all' || p.hospital_name === hospitalFilter;
        const matchesSpec = specFilter === 'all' || p.specialization === specFilter;
        const matchesRank = rankFilter === 'all' || p.grade === rankFilter;

        return matchesName && matchesHospital && matchesSpec && matchesRank;
    });

    // Unique extraction for dropdowns
    const uniqueHospitals = Array.from(new Set(physicians.map(p => p.hospital_name).filter(Boolean))) as string[];
    const uniqueSpecs = Array.from(new Set(physicians.map(p => p.specialization).filter(Boolean))) as string[];
    const uniqueRanks = Array.from(new Set(physicians.map(p => p.grade).filter(Boolean))) as string[];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3 pb-4 border-b">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search doctor name or license..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="pl-9"
                    />
                </div>
                
                <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Hospital" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Hospitals</SelectItem>
                        {uniqueHospitals.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={specFilter} onValueChange={setSpecFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Specialisation" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Specialties</SelectItem>
                        {uniqueSpecs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={rankFilter} onValueChange={setRankFilter}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Clinical Rank" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Ranks</SelectItem>
                        {uniqueRanks.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

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
                {filtered.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                            No physicians found matching filters
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
        </div>
    );
}
