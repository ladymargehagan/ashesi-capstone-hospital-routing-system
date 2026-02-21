'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Building2, Shield, Calendar, Stethoscope, FileText } from 'lucide-react';

export default function PhysicianProfilePage() {
    // In a real app, this would fetch from the API using the authenticated user
    const profile = {
        full_name: 'Dr. Sarah Johnson',
        email: 'physician@clinic.com',
        phone_number: '+233 24 123 4567',
        hospital_name: 'Downtown Medical Clinic',
        license_number: 'MD-12345',
        specialization: 'General Practice',
        status: 'active' as const,
        created_at: '2026-01-20T00:00:00Z',
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500">Physician account details</p>
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
                                <p className="text-gray-500 capitalize">{profile.specialization}</p>
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

                {/* Professional Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Professional Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Hospital</p>
                                <p className="font-medium">{profile.hospital_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Stethoscope className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Specialization</p>
                                <p className="font-medium capitalize">{profile.specialization}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">License Number</p>
                                <p className="font-medium">{profile.license_number}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Member Since</p>
                                <p className="font-medium">{formatDate(profile.created_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
