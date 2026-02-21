'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Building2, Shield, Calendar, Stethoscope, FileText, Loader2 } from 'lucide-react';

export default function PhysicianProfilePage() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
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
                                <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
                                <p className="text-gray-500 capitalize">Physician</p>
                                <Badge className="mt-1 bg-green-100 text-green-700 border-green-200" variant="outline">
                                    {user.status}
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
                                <p className="font-medium">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Phone Number</p>
                                <p className="font-medium">{user.phone_number || 'Not set'}</p>
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
                            <Shield className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Role</p>
                                <p className="font-medium capitalize">{user.role.replace('_', ' ')}</p>
                            </div>
                        </div>
                        {user.hospital_id && (
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Hospital</p>
                                    <p className="font-medium">{user.hospital_name || `Hospital #${user.hospital_id}`}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Member Since</p>
                                <p className="font-medium">{formatDate(user.created_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
