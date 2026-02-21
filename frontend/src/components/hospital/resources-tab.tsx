'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Resource } from '@/types';
import { ResourceUpdateModal } from '@/components/hospital/resource-update-modal';
import { getResourceDisplayName } from '@/lib/api-client';

interface ResourcesTabProps {
    resources: Resource[];
    onResourceUpdated?: () => void;
}

export function ResourcesTab({ resources, onResourceUpdated }: ResourcesTabProps) {
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAvailabilityPercentage = (resource: Resource) => {
        const total = resource.total_count || 0;
        const available = resource.available_count || 0;
        if (total === 0) return 0;
        return Math.round((available / total) * 100);
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 50) return 'bg-green-500';
        if (percentage >= 20) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Resource Management</CardTitle>
                    <CardDescription>Update bed availability and facility resources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {resources.map((resource) => {
                        const percentage = getAvailabilityPercentage(resource);
                        const total = resource.total_count || 0;
                        const available = resource.available_count || 0;
                        const occupied = total - available;

                        return (
                            <div key={resource.id} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">
                                                {getResourceDisplayName(resource.resource_type)}
                                            </h3>
                                            {resource.operator_required && (
                                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                    Operator Required
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Last updated: {formatDate(resource.last_updated)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedResource(resource)}
                                    >
                                        Update
                                    </Button>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Total</p>
                                        <p className="text-2xl font-bold">{total}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Available</p>
                                        <p className="text-2xl font-bold text-green-600">{available}</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>{percentage}% available</span>
                                        <span className="text-gray-500">{occupied} occupied</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getProgressColor(percentage)} transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <ResourceUpdateModal
                resource={selectedResource}
                open={!!selectedResource}
                onClose={() => setSelectedResource(null)}
                onSaved={onResourceUpdated}
            />
        </>
    );
}
