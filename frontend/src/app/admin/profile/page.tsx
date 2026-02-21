'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usersApi, authApi } from '@/lib/api-client';
import { User, Mail, Shield, Calendar, Loader2, Phone } from 'lucide-react';

export default function AdminProfilePage() {
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [fullName, setFullName] = useState(user?.full_name || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');

    if (!user) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            await usersApi.updateProfile(user.id, {
                full_name: fullName,
                phone_number: phoneNumber,
            });
            if (refreshUser) await refreshUser();
            setEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await authApi.logout();
        router.push('/');
    };

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
                <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
                <p className="text-gray-500">Manage your account settings</p>
            </div>

            <div className="space-y-6">
                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Personal Information</CardTitle>
                            {!editing && (
                                <Button variant="outline" size="sm" onClick={() => {
                                    setFullName(user.full_name);
                                    setPhoneNumber(user.phone_number || '');
                                    setEditing(true);
                                }}>
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-bold">
                                    {getInitials(user.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
                                <Badge className="mt-1 bg-purple-100 text-purple-700 border-purple-200" variant="outline">
                                    Super Admin
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        {/* Fields */}
                        {editing ? (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                                </div>
                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
                                )}
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setEditing(false)} disabled={loading}>Cancel</Button>
                                    <Button onClick={handleSave} disabled={loading}>
                                        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Full Name</p>
                                        <p className="font-medium">{user.full_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email Address</p>
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
                                    <Shield className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Role</p>
                                        <p className="font-medium capitalize">{user.role.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Member Since</p>
                                        <p className="font-medium">{formatDate(user.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sign Out */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
                        <CardDescription>Sign out of your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
