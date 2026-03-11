'use client';


import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationInboxPopover } from '@/components/ui/notification-inbox-popover';
import { Building2, LogOut, User } from 'lucide-react';

export function Header() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getRoleLabel = () => {
        switch (user?.role) {
            case 'physician': return 'Physician';
            case 'hospital_admin': return 'Hospital Admin';
            case 'super_admin': return 'System Admin';
            default: return 'User';
        }
    };

    const getHospitalName = () => {
        return user?.hospital_name || null;
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 h-16 border-b bg-white z-50">
                <div className="flex items-center justify-between h-full px-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="font-semibold text-gray-900">Healthcare Referral System</span>
                            <p className="text-xs text-gray-500">Patient Referral Management Platform</p>
                        </div>
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <NotificationInboxPopover />

                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-3 h-auto py-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                                            {user ? getInitials(user.full_name) : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
                                        <p className="text-xs text-gray-500">{getHospitalName() || getRoleLabel()}</p>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <Link href={
                                    user?.role === 'super_admin' ? '/admin/profile' :
                                        user?.role === 'hospital_admin' ? '/hospital/profile' :
                                            '/physician/profile'
                                }>
                                    <DropdownMenuItem>
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

        </>
    );
}
