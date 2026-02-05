'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import {
    LayoutDashboard,
    Users,
    FileText,
    Building2,
    UserCheck,
    Bed,
    Stethoscope,
    ClipboardList
} from 'lucide-react';

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
}

const physicianNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/physician', icon: LayoutDashboard },
    { title: 'Patients', href: '/physician/patients', icon: Users },
    { title: 'Referrals', href: '/physician/referrals', icon: FileText },
    { title: 'New Referral', href: '/physician/referral', icon: ClipboardList },
];

const hospitalNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/hospital', icon: LayoutDashboard },
    { title: 'Referrals', href: '/hospital/referrals', icon: FileText },
    { title: 'Resources', href: '/hospital/resources', icon: Bed },
    { title: 'Specialists', href: '/hospital/specialists', icon: Stethoscope },
];

const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Hospitals', href: '/admin/hospitals', icon: Building2 },
    { title: 'Physicians', href: '/admin/physicians', icon: UserCheck },
];

export function Sidebar({ role }: { role: UserRole }) {
    const pathname = usePathname();

    const navItems = role === 'physician'
        ? physicianNavItems
        : role === 'hospital_admin'
            ? hospitalNavItems
            : adminNavItems;

    return (
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-white">
            <nav className="flex flex-col gap-1 p-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/physician' && item.href !== '/hospital' && item.href !== '/admin' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
