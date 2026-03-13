'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usersApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toast-provider';
import { User, Mail, Phone, Building2, Shield, Calendar, Loader2, Edit3, Save, X } from 'lucide-react';

export default function PhysicianProfilePage() {
    const { user } = useAuth();
    const toast = useToast();
    
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        title: '',
        license_number: '',
        specialization: '',
        department: '',
        grade: ''
    });

    const handleEdit = () => {
        setFormData({
            full_name: user?.full_name || '',
            phone_number: user?.phone_number || '',
            title: (user as any)?.title || '',
            license_number: (user as any)?.license_number || '',
            specialization: (user as any)?.specialization || '',
            department: (user as any)?.department || '',
            grade: (user as any)?.grade || ''
        });
        setEditing(true);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await usersApi.updateProfile(user.id, formData);
            // In a real app we might refetch the user or update context here.
            toast.success('Profile updated successfully! Refresh to see changes.');
            setEditing(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

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
                                    <div className="space-y-2">
                                        <Label>Title (e.g. Dr.)</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>License Number</Label>
                                        <Input
                                            value={formData.license_number}
                                            onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Specialization</Label>
                                        <Input
                                            value={formData.specialization}
                                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Input
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Grade/Level</Label>
                                        <Input
                                            value={formData.grade}
                                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
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
                            <div className="grid grid-cols-2 gap-4">
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
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Title</p>
                                        <p className="font-medium capitalize">{(user as any).title || 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">License Number</p>
                                        <p className="font-medium">{(user as any).license_number || 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Specialization</p>
                                        <p className="font-medium">{(user as any).specialization || 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Department</p>
                                        <p className="font-medium">{(user as any).department || 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Grade/Level</p>
                                        <p className="font-medium">{(user as any).grade || 'Not set'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
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
