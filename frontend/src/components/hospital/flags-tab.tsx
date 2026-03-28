'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { hospitalsApi } from '@/lib/api-client';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

interface FlagsTabProps {
    flags: any[];
    onFlagResolved: () => void;
}

export function FlagsTab({ flags, onFlagResolved }: FlagsTabProps) {
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const toast = useToast();

    const handleResolve = async (flagId: string) => {
        setResolvingId(flagId);
        try {
            const res = await hospitalsApi.resolveFlag(flagId);
            if (res.success) {
                onFlagResolved();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to resolve flag');
        } finally {
            setResolvingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatCategory = (cat: string) => 
        cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Data Inconsistency Flags
                </CardTitle>
                <CardDescription>
                    Physicians have reported discrepancies with your hospital's data. Review and resolve these to ensure correct routing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {flags.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-slate-50 rounded-lg border border-dashed">
                        <CheckCircle className="h-10 w-10 mx-auto text-green-400 mb-3" />
                        <h3 className="font-medium text-gray-900">All Clear!</h3>
                        <p className="text-sm mt-1">No active data inconsistency flags for your hospital.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {flags.map(flag => (
                            <div key={flag.flag_id} className="border border-amber-200 bg-amber-50/30 rounded-lg p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                            {formatCategory(flag.category)}
                                        </Badge>
                                        <span className="text-xs text-gray-500">Reported on {formatDate(flag.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-2">
                                        <span className="font-medium text-gray-900">Notes from Dr. {flag.flagging_physician_name}:</span><br/>
                                        {flag.notes || "No additional notes provided."}
                                    </p>
                                </div>
                                <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-amber-100 shrink-0">
                                    <Button 
                                        onClick={() => handleResolve(flag.flag_id)} 
                                        disabled={resolvingId === flag.flag_id}
                                        className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                                    >
                                        {resolvingId === flag.flag_id ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                        )}
                                        Mark as Fixed
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
