import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function PhysicianLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout role="physician">{children}</DashboardLayout>;
}
