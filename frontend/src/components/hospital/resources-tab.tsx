'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Resource } from '@/types';
import { ResourceUpdateModal } from '@/components/hospital/resource-update-modal';

interface ResourcesTabProps {
    resources: Resource[];
}

export function ResourcesTab({ resources }: ResourcesTabProps) {
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
        return Math.round((resource.available / resource.total) * 100);
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
                        const occupied = resource.total - resource.available - resource.reserved;

                        return (
                            <div key={resource.id} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{resource.type}</h3>
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
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Total</p>
                                        <p className="text-2xl font-bold">{resource.total}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Available</p>
                                        <p className="text-2xl font-bold text-green-600">{resource.available}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Reserved</p>
                                        <p className="text-2xl font-bold text-red-600">{resource.reserved}</p>
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
            />
        </>
    );
}
