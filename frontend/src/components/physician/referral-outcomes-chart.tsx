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
            'admitted_treated': 'Admitted & Treated',
            'treated_discharged': 'Treated & Discharged',
            'referred_further': 'Referred Further',
            'deceased': 'Deceased',
            'absconded': 'Absconded'
        };

        const COLORS: Record<string, string> = {
            'admitted_treated': '#0ea5e9', // sky-500
            'treated_discharged': '#22c55e', // green-500
            'referred_further': '#f59e0b', // amber-500
            'deceased': '#ef4444', // red-500
            'absconded': '#64748b', // slate-500
        };

        return Object.entries(counts).map(([key, value]) => ({
            name: LABELS[key] || key,
            value,
            color: COLORS[key] || '#94a3b8'
        })).sort((a, b) => b.value - a.value);

    }, [referrals]);

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Completed Referral Outcomes
                </CardTitle>
                <CardDescription>Visual breakdown of final patient outcomes</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-sm text-gray-500 bg-slate-50 rounded-md border border-dashed">
                        No outcome data available yet.
                    </div>
                ) : (
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
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
                                    formatter={(value: number) => [`${value} Patients`, 'Count']}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
