'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Specialist } from '@/types';
import { specialistsApi } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

interface SpecialistsTabProps {
    specialists: Specialist[];
    onSpecialistUpdated?: () => void;
}

export function SpecialistsTab({ specialists, onSpecialistUpdated }: SpecialistsTabProps) {
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const getInitials = (name?: string) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleToggleAvailability = async (specialist: Specialist) => {
        setTogglingId(specialist.id);
        try {
            await specialistsApi.update(specialist.id, {
                on_call_available: !specialist.on_call_available,
            });
            onSpecialistUpdated?.();
        } catch (err) {
            console.error('Failed to toggle availability:', err);
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Available Specialists</CardTitle>
                <CardDescription>Click the badge to toggle specialist availability</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specialists.map((specialist) => (
                        <div
                            key={specialist.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-blue-100 text-blue-700">
                                        {getInitials(specialist.specialist_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{specialist.specialist_name || 'Unknown'}</p>
                                    <p className="text-sm text-gray-500">{specialist.specialty}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggleAvailability(specialist)}
                                disabled={togglingId === specialist.id}
                                className="cursor-pointer disabled:cursor-wait"
                            >
                                {togglingId === specialist.id ? (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        Updating...
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className={
                                            specialist.on_call_available
                                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                        }
                                    >
                                        {specialist.on_call_available ? 'Available' : 'Unavailable'}
                                    </Badge>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
