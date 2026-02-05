'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Specialist } from '@/types';

interface SpecialistsTabProps {
    specialists: Specialist[];
}

export function SpecialistsTab({ specialists }: SpecialistsTabProps) {
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Available Specialists</CardTitle>
                <CardDescription>Current specialist availability status</CardDescription>
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
                                        {getInitials(specialist.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{specialist.name}</p>
                                    <p className="text-sm text-gray-500">{specialist.specialty}</p>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={
                                    specialist.available
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                }
                            >
                                {specialist.available ? 'Available' : 'Unavailable'}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
