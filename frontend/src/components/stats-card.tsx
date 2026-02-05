'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    iconColor?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    iconColor = 'text-blue-600'
}: StatsCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${iconColor}`} />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                {description && (
                    <CardDescription className="text-xs text-gray-500 mt-1">
                        {description}
                    </CardDescription>
                )}
            </CardContent>
        </Card>
    );
}
