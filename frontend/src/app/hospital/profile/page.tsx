'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Building2, MapPin, Calendar, Clock, Shield } from 'lucide-react';

export default function HospitalProfilePage() {
    // In a real app, this would fetch from the API using the authenticated user
    const profile = {
        full_name: 'John Administrator',
        email: 'hospital@general.com',
        phone_number: '+233 24 555 1234',
        hospital: {
            name: 'City General Hospital',
            license_number: 'HLC-001',
            address: '123 Main Street, Accra',
            tier: 'tier_3',
            type: 'teaching',
            ownership: 'public',
            operating_hours: '24/7',
            contact_phone: '+233 30 277 1234',
            status: 'active' as const,
            created_at: '2026-01-02T00:00:00Z',
        },
        status: 'active' as const,
        created_at: '2026-01-15T00:00:00Z',
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const getTierLabel = (tier: string) => {
        return tier.replace('_', ' ').toUpperCase();
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Hospital Profile</h1>
                <p className="text-gray-500">Hospital administrator account details</p>
            </div>

            <div className="space-y-6">
                {/* Profile Header */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
                                <p className="text-gray-500">Hospital Administrator</p>
                                <Badge className="mt-1 bg-green-100 text-green-700 border-green-200" variant="outline">
                                    {profile.status}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{profile.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Phone Number</p>
                                <p className="font-medium">{profile.phone_number}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Hospital Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Hospital Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Hospital Name</p>
                                <p className="font-medium">{profile.hospital.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">License Number</p>
                                <p className="font-medium">{profile.hospital.license_number}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-medium">{profile.hospital.address}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">Tier</p>
                                <Badge className="mt-1 bg-blue-100 text-blue-700 border-blue-200" variant="outline">
                                    {getTierLabel(profile.hospital.tier)}
                                </Badge>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">Type</p>
                                <p className="font-medium capitalize">{profile.hospital.type}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">Ownership</p>
                                <p className="font-medium capitalize">{profile.hospital.ownership.replace('_', ' ')}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">Operating Hours</p>
                                <p className="font-medium">{profile.hospital.operating_hours}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Hospital Phone</p>
                                <p className="font-medium">{profile.hospital.contact_phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Registered Since</p>
                                <p className="font-medium">{formatDate(profile.hospital.created_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
