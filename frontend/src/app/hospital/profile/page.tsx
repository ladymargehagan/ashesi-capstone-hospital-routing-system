'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { hospitalsApi, usersApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast-provider';
import { Hospital } from '@/types';
import { User, Mail, Phone, Building2, MapPin, Calendar, Clock, Shield, Loader2, Edit3, Save, X } from 'lucide-react';

export default function HospitalProfilePage() {
    const { user } = useAuth();
    const toast = useToast();
    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Edit state
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: ''
    });

    const handleEdit = () => {
        setFormData({
            full_name: user?.full_name || '',
            phone_number: user?.phone_number || ''
        });
        setEditing(true);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await usersApi.updateProfile(user.id, formData);
            toast.success('Admin profile updated successfully! Refresh to see changes.');
            setEditing(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to update admin profile');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (!user?.hospital_id) {
            setLoading(false);
            return;
        }
        hospitalsApi.get(user.hospital_id)
            .then((data) => setHospital(data as unknown as Hospital))
            .catch((err) => console.error('Failed to load hospital:', err))
            .finally(() => setLoading(false));
    }, [user?.hospital_id]);

    if (!user || loading) {
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

    const getLevelLabel = (level: string) => {
        return (level || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
                                <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
                                <p className="text-gray-500">Hospital Administrator</p>
                                <Badge className="mt-1 bg-green-100 text-green-700 border-green-200" variant="outline">
                                    {user.status}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Contact Information</CardTitle>
                        </div>
                        {!editing && (
                            <Button variant="outline" size="sm" onClick={handleEdit}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Profile
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {editing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone Number</Label>
                                        <Input
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                                        <X className="h-4 w-4 mr-2" /> Cancel
                                    </Button>
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} 
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Hospital Details */}
                {hospital && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Hospital Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Hospital Name</p>
                                    <p className="font-medium">{hospital.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">License Number</p>
                                    <p className="font-medium">{hospital.license_number}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Address</p>
                                    <p className="font-medium">{hospital.address}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Level</p>
                                    <Badge className="mt-1 bg-blue-100 text-blue-700 border-blue-200" variant="outline">
                                        {getLevelLabel(hospital.level)}
                                    </Badge>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Type</p>
                                    <p className="font-medium capitalize">{hospital.type}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Ownership</p>
                                    <p className="font-medium capitalize">{hospital.ownership.replace('_', ' ')}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Operating Hours</p>
                                    <p className="font-medium">{hospital.operating_hours || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Hospital Phone</p>
                                    <p className="font-medium">{hospital.contact_phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Registered Since</p>
                                    <p className="font-medium">{formatDate(hospital.created_at)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
