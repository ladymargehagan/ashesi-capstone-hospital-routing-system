import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function HospitalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout role="hospital_admin">{children}</DashboardLayout>;
}
