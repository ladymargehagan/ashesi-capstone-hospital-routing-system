'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface HospitalHealthTableProps {
    healthData: any[];
}

export function HospitalHealthTable({ healthData }: HospitalHealthTableProps) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getHealthColor = (status: string) => {
        switch (status) {
            case 'Healthy': return 'bg-green-100 text-green-700';
            case 'Warning': return 'bg-amber-100 text-amber-700';
            case 'Critical': return 'bg-red-100 text-red-700';
            case 'Inactive': return 'bg-gray-100 text-gray-700';
            default: return 'bg-primary/10 text-secondary';
        }
    };

    return (
        <div className="overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Hospital</TableHead>
                    <TableHead>System Status</TableHead>
                    <TableHead>Last Resources Update</TableHead>
                    <TableHead className="text-center">Active Data Flags</TableHead>
                    <TableHead className="text-center">Activity (Out/In)</TableHead>
                    <TableHead>Identified Issues</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {healthData.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No health data computed.
                        </TableCell>
                    </TableRow>
                ) : (
                    healthData.map((data) => (
                        <TableRow key={data.hospital_id} className={data.computed_health === 'Critical' ? 'bg-red-50/50' : data.computed_health === 'Warning' ? 'bg-amber-50/50' : ''}>
                            <TableCell className="font-medium">
                                {data.hospital_name}
                                {data.hospital_level && (
                                    <div className="text-xs text-gray-500 mt-0.5 capitalize">
                                        {data.hospital_level.replace(/_/g, ' ')}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge className={getHealthColor(data.computed_health)}>
                                    {data.computed_health === 'Healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {data.computed_health === 'Warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                    {data.computed_health === 'Critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                    {data.computed_health}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    <span className={data.computed_health !== 'Healthy' && !data.last_resource_update ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                        {formatDate(data.last_resource_update)}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <span className={data.active_flags_count > 0 ? 'text-amber-600 font-bold' : 'text-gray-600'}>
                                    {data.active_flags_count}
                                </span>
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-600">
                                {data.outgoing_referrals} / {data.incoming_referrals}
                            </TableCell>
                            <TableCell>
                                {data.health_issues.length > 0 ? (
                                    <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
                                        {data.health_issues.map((issue: string, i: number) => (
                                            <li key={i}>{issue}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-xs text-green-600">None detected</span>
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
