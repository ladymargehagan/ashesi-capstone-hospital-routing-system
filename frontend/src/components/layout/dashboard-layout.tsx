'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { UserRole } from '@/types';

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: UserRole;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header onMenuClick={() => setSidebarOpen(prev => !prev)} />
            <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="pt-16 lg:pl-64">
                <div className="p-4 sm:p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
