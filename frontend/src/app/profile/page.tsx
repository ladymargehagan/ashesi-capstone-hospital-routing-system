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
import { mockHospitals } from '@/lib/mock-data';
import { User, Mail, Building2, Shield, Calendar, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);

    // Form state
    const [name, setName] = useState(user?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');

    if (!user) {
        router.push('/');
        return null;
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getRoleLabel = (role: string) => {
        const labels = {
            physician: 'Physician',
            hospital_admin: 'Hospital Administrator',
            super_admin: 'System Administrator',
        };
        return labels[role as keyof typeof labels] || role;
    };

    const getRoleBadgeStyle = (role: string) => {
        const styles = {
            physician: 'bg-blue-100 text-blue-700 border-blue-200',
            hospital_admin: 'bg-purple-100 text-purple-700 border-purple-200',
            super_admin: 'bg-amber-100 text-amber-700 border-amber-200',
        };
        return styles[role as keyof typeof styles] || styles.physician;
    };

    const getHospitalName = () => {
        if (user.hospital_id) {
            const hospital = mockHospitals.find(h => h.id === user.hospital_id);
            return hospital?.name || 'Unknown Hospital';
        }
        return null;
    };

    const getDashboardLink = () => {
        if (user.role === 'physician') return '/physician';
        if (user.role === 'hospital_admin') return '/hospital';
        return '/admin';
    };

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        setEditing(false);
        alert('Profile updated successfully!');
    };

    const handleSignOut = () => {
        logout();
        router.push('/');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Back Button */}
            <Link href={getDashboardLink()}>
                <Button variant="ghost" className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>
            </Link>

            {/* Profile Header Card */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                                {getInitials(user.full_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
                            <p className="text-gray-500">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className={getRoleBadgeStyle(user.role)} variant="outline">
                                    {getRoleLabel(user.role)}
                                </Badge>
                                {getHospitalName() && (
                                    <Badge variant="outline" className="text-gray-600">
                                        {getHospitalName()}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Details Card */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Account Details</CardTitle>
                            <CardDescription>Manage your account information</CardDescription>
                        </div>
                        {!editing && (
                            <Button variant="outline" onClick={() => setEditing(true)}>
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {editing ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={() => setEditing(false)} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 py-2">
                                <User className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Full Name</p>
                                    <p className="font-medium">{user.full_name}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-3 py-2">
                                <Mail className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Email Address</p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-3 py-2">
                                <Shield className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Role</p>
                                    <p className="font-medium">{getRoleLabel(user.role)}</p>
                                </div>
                            </div>
                            {getHospitalName() && (
                                <>
                                    <Separator />
                                    <div className="flex items-center gap-3 py-2">
                                        <Building2 className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Affiliated Hospital</p>
                                            <p className="font-medium">{getHospitalName()}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            <Separator />
                            <div className="flex items-center gap-3 py-2">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Account Created</p>
                                    <p className="font-medium">{formatDate(user.created_at)}</p>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Sign Out Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Session</CardTitle>
                    <CardDescription>Manage your current session</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        onClick={handleSignOut}
                    >
                        Sign Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
