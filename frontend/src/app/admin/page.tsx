'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { StatsCard } from '@/components/stats-card';
import { HospitalsTable } from '@/components/admin/hospitals-table';
import { AddHospitalModal } from '@/components/admin/add-hospital-modal';
import { PhysiciansTable } from '@/components/admin/physicians-table';
import { HospitalHealthTable } from '@/components/admin/hospital-health-table';
import { AuditAlertsBox } from '@/components/admin/audit-alerts-box';
import { hospitalsApi, usersApi, healthApi } from '@/lib/api-client';
import { Hospital, Physician } from '@/types';
import { Building2, Users, CheckCircle, Clock, Search, Loader2, Stethoscope, Activity, Plus, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('physicians');
    const [isAddHospitalOpen, setIsAddHospitalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [physicians, setPhysicians] = useState<Physician[]>([]);
    const [healthData, setHealthData] = useState<any[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        setLoading(true);
        Promise.all([
            hospitalsApi.list().catch(() => []),
            usersApi.listPhysicians().catch(() => []),
            healthApi.getSummary().catch(() => []),
        ]).then(([hosps, physs, hdata]) => {
            setHospitals(hosps as unknown as Hospital[]);
            setPhysicians(physs as unknown as Physician[]);
            setHealthData(hdata);
        }).finally(() => setLoading(false));
    };

    const handleRunAudit = async () => {
        setAuditLoading(true);
        try {
            const res = await healthApi.runAudit();
            alert(`Audit Complete:\n${res.summary}`);
            loadData(); // refresh health data
        } catch (err: any) {
            alert(err.message || 'Failed to trigger audit');
        } finally {
            setAuditLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const pendingPhysicians = physicians.filter(p => p.status === 'pending');
    const activePhysicians = physicians.filter(p => p.status === 'active');

    // Filter based on search
    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.level || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.address || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPhysicians = physicians.filter(p =>
        (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.license_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.hospital_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500">Manage physician registrations and view the hospital network</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title="Pending Doctors"
                    value={pendingPhysicians.length}
                    description="Awaiting approval"
                    icon={Clock}
                    iconColor="text-amber-600"
                />
                <StatsCard
                    title="Active Doctors"
                    value={activePhysicians.length}
                    description="Verified & active"
                    icon={Stethoscope}
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Total Hospitals"
                    value={hospitals.length}
                    description="In the network"
                    icon={Building2}
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Total Physicians"
                    value={physicians.length}
                    description="Across all hospitals"
                    icon={Users}
                    iconColor="text-purple-600"
                />
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-1">System Overview</h2>
                <p className="text-sm text-gray-500 mb-4">Approve doctor registrations and browse the hospital directory</p>

                {/* Tabs with Search */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="physicians">
                                <Activity className="h-4 w-4 mr-1.5" />
                                Physicians ({physicians.length})
                                {pendingPhysicians.length > 0 && (
                                    <span className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                                        {pendingPhysicians.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="hospitals">
                                <Building2 className="h-4 w-4 mr-1.5" />
                                Hospitals ({hospitals.length})
                            </TabsTrigger>
                            <TabsTrigger value="health" className="text-amber-600 font-medium">
                                <ShieldAlert className="h-4 w-4 mr-1.5" />
                                System Health
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-3">
                            {activeTab === 'health' && (
                                <Button 
                                    onClick={handleRunAudit}
                                    variant="outline"
                                    disabled={auditLoading}
                                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                >
                                    {auditLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                    Run System Audit
                                </Button>
                            )}
                            {activeTab === 'hospitals' && (
                                <Button 
                                    onClick={() => setIsAddHospitalOpen(true)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Hospital
                                </Button>
                            )}
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    <TabsContent value="physicians" className="mt-0">
                        <PhysiciansTable physicians={filteredPhysicians} onStatusChanged={loadData} />
                    </TabsContent>

                    <TabsContent value="hospitals" className="mt-0">
                        <HospitalsTable hospitals={filteredHospitals} onStatusChanged={loadData} />
                    </TabsContent>

                    <TabsContent value="health" className="mt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <div className="lg:col-span-2 bg-white rounded-lg border p-6">
                                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-500" />
                                    Network Health Monitor
                                </h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    This dashboard computes the freshness and accuracy of hospital data. Facilities displaying Warning or Critical states may disrupt routing efficiency. Use the "Run System Audit" button to trigger automated alerts.
                                </p>
                                <HospitalHealthTable healthData={healthData} />
                            </div>
                            
                            <div className="lg:col-span-1">
                                <AuditAlertsBox />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
                
                <AddHospitalModal 
                    open={isAddHospitalOpen} 
                    onClose={() => setIsAddHospitalOpen(false)} 
                    onAdded={() => {
                        loadData();
                    }}
                />
            </div>
        </div>
    );
}
