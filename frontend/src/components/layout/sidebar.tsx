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
    ClipboardList,
    Stethoscope
} from 'lucide-react';

interface SidebarProps {
    role: UserRole;
    isOpen?: boolean;
    onClose?: () => void;
}

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
    { title: 'My Hospital', href: '/physician/my-hospital', icon: Bed },
    { title: 'Hospitals', href: '/physician/hospitals', icon: Building2 },
];

const hospitalNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/hospital', icon: LayoutDashboard },
    { title: 'Referrals', href: '/hospital/referrals', icon: FileText },
    { title: 'Physicians', href: '/hospital/physicians', icon: UserCheck },
    { title: 'Specialists', href: '/hospital/specialists', icon: Stethoscope },
    { title: 'Resources', href: '/hospital/resources', icon: Bed },
];

const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Hospitals', href: '/admin/hospitals', icon: Building2 },
    { title: 'Physicians', href: '/admin/physicians', icon: UserCheck },
];

export function Sidebar({ role, isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();

    const navItems = role === 'physician'
        ? physicianNavItems
        : role === 'hospital_admin'
            ? hospitalNavItems
            : adminNavItems;

    const isRouteActive = (href: string) => {
        if (pathname === href) {
            return true;
        }

        if (href === '/physician' || href === '/hospital' || href === '/admin') {
            return false;
        }

        return pathname.startsWith(`${href}/`);
    };

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                'fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card z-40',
                'transition-transform duration-200 ease-in-out',
                'lg:translate-x-0',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                <nav className="flex flex-col gap-1 p-4">
                    {navItems.map((item) => {
                        const isActive = isRouteActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary/10 text-foreground shadow-[inset_4px_0_0_0_var(--color-primary)]'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
