'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Referral } from '@/types';
import { Activity } from 'lucide-react';

interface ReferralOutcomesChartProps {
    referrals: Referral[];
}

export function ReferralOutcomesChart({ referrals }: ReferralOutcomesChartProps) {
    // Only count completed referrals with an outcome
    const data = useMemo(() => {
        const completed = referrals.filter(r => r.status === 'completed' && r.outcome);
        
        const counts = completed.reduce((acc, ref) => {
            const outcomeStr = String(ref.outcome);
            acc[outcomeStr] = (acc[outcomeStr] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const LABELS: Record<string, string> = {
            // stored in DB
            'discharged': 'Discharged',
            'transferred_again': 'Transferred Again',
            'ongoing': 'Ongoing',
            'deceased': 'Deceased',
            'absconded': 'Absconded',
            // legacy / alternative keys
            'admitted_treated': 'Admitted & Treated',
            'treated_discharged': 'Treated & Discharged',
            'referred_further': 'Referred Further',
        };

        const COLORS: Record<string, string> = {
            'discharged': '#22c55e',       // green  — positive outcome
            'treated_discharged': '#22c55e',
            'admitted_treated': '#0ea5e9', // sky    — still receiving care
            'ongoing': '#3b82f6',          // blue   — still receiving care
            'transferred_again': '#f59e0b',// amber  — re-routed
            'referred_further': '#f59e0b',
            'deceased': '#ef4444',         // red    — negative outcome
            'absconded': '#64748b',        // slate  — unknown outcome
        };

        // Fallback palette for any unexpected outcome keys
        const FALLBACK_COLORS = ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];
        let fallbackIdx = 0;

        return Object.entries(counts).map(([key, value]) => ({
            name: LABELS[key] || key.replace(/_/g, ' '),
            value,
            color: COLORS[key] ?? FALLBACK_COLORS[fallbackIdx++ % FALLBACK_COLORS.length],
        })).sort((a, b) => b.value - a.value);

    }, [referrals]);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary/80" />
                    Completed Referral Outcomes
                </CardTitle>
                <CardDescription>Visual breakdown of final patient outcomes</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
                {data.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-sm text-gray-500 bg-slate-50 rounded-md border border-dashed">
                        No outcome data available yet.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="40%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [`${value} Patients`, 'Count']}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                wrapperStyle={{ fontSize: '12px' }}
                                formatter={(value, entry: any) => (
                                    <span style={{ color: '#374151', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: entry.color, flexShrink: 0 }} />
                                        {value}
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
