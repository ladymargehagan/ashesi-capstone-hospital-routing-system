'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { resourcesApi, hospitalsApi } from '@/lib/api-client';
import { getResourceDisplayName } from '@/lib/api-client';
import { Resource } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

export default function MyHospitalPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [resources, setResources] = useState<Resource[]>([]);
    const [hospitalName, setHospitalName] = useState('');
    const [loading, setLoading] = useState(true);

    // Report inaccuracy modal state
    const [reportOpen, setReportOpen] = useState(false);
    const [reportResource, setReportResource] = useState<Resource | null>(null);
    const [reportNotes, setReportNotes] = useState('');
    const [reportLoading, setReportLoading] = useState(false);

    const fetchData = useCallback(() => {
        if (!user?.hospital_id) return;
        Promise.all([
            resourcesApi.list(user.hospital_id).catch(() => []),
            hospitalsApi.get(user.hospital_id).catch(() => null),
        ]).then(([res, hosp]) => {
            setResources(res as unknown as Resource[]);
            if (hosp) setHospitalName((hosp as any).name || '');
        }).finally(() => setLoading(false));
    }, [user?.hospital_id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openReport = (resource: Resource) => {
        setReportResource(resource);
        setReportNotes('');
        setReportOpen(true);
    };

    const handleSubmitReport = async () => {
        if (!reportResource || !reportNotes.trim() || !user?.hospital_id) return;
        setReportLoading(true);
        try {
            await resourcesApi.reportInaccuracy(
                user.hospital_id,
                reportResource.resource_type,
                reportNotes.trim(),
            );
            toast.success('Your report has been sent to the hospital admin.');
            setReportOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit report.');
        } finally {
            setReportLoading(false);
        }
    };

    const getAvailabilityPercentage = (r: Resource) => {
        const total = r.total_count || 0;
        const available = r.available_count || 0;
        if (total === 0) return 0;
        return Math.round((available / total) * 100);
    };

    const getProgressColor = (pct: number) => {
        if (pct >= 50) return 'bg-green-500';
        if (pct >= 20) return 'bg-amber-500';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    {hospitalName || 'My Hospital'}
                </h1>
                <p className="text-gray-500">View your hospital&apos;s resources and report any data inaccuracies</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Hospital Resources</CardTitle>
                    <CardDescription>
                        If you notice any data that doesn&apos;t match reality, click &quot;Report Inaccuracy&quot; to notify your hospital admin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {resources.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="font-medium">No resources listed for your hospital yet.</p>
                        </div>
                    ) : (
                        resources.map((resource) => {
                            const pct = getAvailabilityPercentage(resource);
                            const total = resource.total_count || 0;
                            const available = resource.available_count || 0;
                            const occupied = total - available;

                            return (
                                <div key={resource.id} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">
                                                    {getResourceDisplayName(resource.resource_type)}
                                                </h3>
                                                {resource.operator_required && (
                                                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                        Operator Required
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Last updated: {new Date(resource.last_updated).toLocaleString()}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-amber-700 border-amber-300 hover:bg-amber-50"
                                            onClick={() => openReport(resource)}
                                        >
                                            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                                            Report Inaccuracy
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Total</p>
                                            <p className="text-xl font-bold">{total}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Available</p>
                                            <p className="text-xl font-bold text-green-600">{available}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Occupied</p>
                                            <p className="text-xl font-bold text-gray-600">{occupied}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>{pct}% available</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getProgressColor(pct)} transition-all`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>

            {/* Report Inaccuracy Modal */}
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Report Data Inaccuracy
                        </DialogTitle>
                        <DialogDescription>
                            Let your hospital admin know that the data for{' '}
                            <strong>{reportResource ? getResourceDisplayName(reportResource.resource_type) : ''}</strong>{' '}
                            needs to be corrected.
                        </DialogDescription>
                    </DialogHeader>

                    {reportResource && (
                        <div className="bg-slate-50 p-3 rounded-md text-sm border space-y-1">
                            <p><span className="text-gray-500">Current Total:</span> <strong>{reportResource.total_count}</strong></p>
                            <p><span className="text-gray-500">Current Available:</span> <strong>{reportResource.available_count}</strong></p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notes">What is inaccurate?</Label>
                        <Textarea
                            id="notes"
                            placeholder="e.g., ICU shows 8 available but only 3 beds are actually free..."
                            value={reportNotes}
                            onChange={(e) => setReportNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={handleSubmitReport}
                            disabled={reportLoading || !reportNotes.trim()}
                        >
                            {reportLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Send Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
