'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Physician } from '@/types';
import { usersApi } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

interface SpecialistsTabProps {
    specialists: Physician[];
    onUpdated?: () => void;
}

export function SpecialistsTab({ specialists, onUpdated }: SpecialistsTabProps) {
    const toast = useToast();
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const getInitials = (name?: string) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleToggleAvailability = async (physician: Physician) => {
        setTogglingId(physician.id);
        try {
            await usersApi.togglePhysicianAvailability(physician.id, !physician.availability);
            onUpdated?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to toggle availability');
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Specialists ({specialists.length})</CardTitle>
                <CardDescription>
                    These are approved physicians at your hospital who registered with a specialization.
                    Toggle their availability to indicate on-call status to the routing algorithm.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {specialists.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                        No physicians with specializations found. Physicians select their specialization when they register.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {specialists.map((physician) => (
                            <div
                                key={physician.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-primary/10 text-secondary">
                                            {getInitials(physician.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">
                                            {physician.title ? `${physician.title} ` : ''}
                                            {physician.full_name || 'Unnamed'}
                                        </p>
                                        <p className="text-sm text-gray-500">{physician.specialization}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleAvailability(physician)}
                                    disabled={togglingId === physician.id}
                                    className={
                                        togglingId === physician.id
                                            ? 'border-gray-200 text-gray-500'
                                            : physician.availability
                                                ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                                                : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }
                                >
                                    {togglingId === physician.id ? (
                                        <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Updating...</>
                                    ) : (
                                        physician.availability ? 'Available' : 'Unavailable'
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
