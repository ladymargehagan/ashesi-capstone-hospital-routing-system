'use client';

import { AuthProvider } from '@/hooks/use-auth';

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthProvider>{children}</AuthProvider>;
}
