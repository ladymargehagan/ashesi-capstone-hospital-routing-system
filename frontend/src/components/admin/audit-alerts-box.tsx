'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { healthApi } from '@/lib/api-client';

export function AuditAlertsBox() {
    const [alerts, setAlerts] = useState<any[]>([]);

    const fetchAlerts = async () => {
        try {
            const res = await healthApi.getAlerts();
            setAlerts(res);
        } catch (err) {
            console.error('Failed to fetch alerts', err);
        }
    };

    useEffect(() => {
        fetchAlerts();
        // optionally set up polling here
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-GB', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-md flex items-center gap-2">
                    <Bell className="h-4 w-4 text-purple-600" />
                    Recent System Alerts
                </CardTitle>
                <CardDescription>
                    Automated audit findings and important health events
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-64 pr-4 overflow-y-auto">
                    {alerts.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-6">
                            No alerts generated yet. Run a system audit to check data.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {alerts.map((alert) => {
                                const details = typeof alert.details === 'string' 
                                    ? JSON.parse(alert.details) 
                                    : alert.details;
                                
                                const isWarning = details.result?.includes('Warning') || details.result?.includes('Critical');

                                return (
                                    <div key={alert.log_id} className={`p-3 border rounded-md text-sm ${isWarning ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(alert.created_at)}
                                        </div>
                                        <div className={isWarning ? 'text-amber-900' : 'text-slate-800'}>
                                            {details.result || 'System Audit executed'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
