'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RecommendationsModal } from '@/components/physician/recommendations-modal';
import { mockPatients, mockRecommendations } from '@/lib/mock-data';
import { ReferralFormData, Patient, HospitalRecommendation } from '@/types';
import { ArrowLeft, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';

function ReferralFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedPatientId = searchParams.get('patient');

    const [showRecommendations, setShowRecommendations] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState<HospitalRecommendation | null>(null);
    const [loading, setLoading] = useState(false);

    // Find preselected patient
    const preselectedPatient = preselectedPatientId
        ? mockPatients.find(p => p.id === preselectedPatientId)
        : null;

    const [formData, setFormData] = useState<Partial<ReferralFormData>>({
        patient_id: preselectedPatient?.id || '',
        full_name: preselectedPatient?.name || '',
        age: preselectedPatient?.age || 0,
        date_of_birth: preselectedPatient?.date_of_birth || '',
        sex: preselectedPatient?.gender || 'Male',
        address: preselectedPatient?.address || '',
        nhis_status: preselectedPatient?.nhis_status || 'None',
        presenting_complaint: preselectedPatient?.diagnosis || '',
        clinical_history: '',
        examination_findings: '',
        investigations_results: '',
        diagnosis: preselectedPatient?.diagnosis || '',
        treatment_given: '',
        reason_for_referral: '',
        urgency: 'Routine',
        referral_datetime: new Date().toISOString().slice(0, 16),
    });

    const handlePatientSelect = (patientId: string) => {
        const patient = mockPatients.find(p => p.id === patientId);
        if (patient) {
            setFormData({
                ...formData,
                patient_id: patient.id,
                full_name: patient.name,
                age: patient.age,
                date_of_birth: patient.date_of_birth,
                sex: patient.gender,
                address: patient.address,
                nhis_status: patient.nhis_status,
                presenting_complaint: patient.diagnosis,
                diagnosis: patient.diagnosis,
            });
        }
    };

    const handleInputChange = (field: keyof ReferralFormData, value: string | number) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleGetRecommendations = () => {
        setShowRecommendations(true);
    };

    const handleSelectHospital = (recommendation: HospitalRecommendation) => {
        setSelectedHospital(recommendation);
        setFormData({ ...formData, hospital_id: recommendation.hospital.id });
        setShowRecommendations(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real app, this would submit to the API
        alert('Referral submitted successfully!');
        router.push('/physician');
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/physician">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Referral</h1>
                    <p className="text-gray-500">Complete the NHIS/MOH referral form</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient Details Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Patient Details</CardTitle>
                        <CardDescription>Select a patient or enter details manually</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Patient Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="patient">Select Patient</Label>
                            <Select
                                value={formData.patient_id}
                                onValueChange={handlePatientSelect}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a patient" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockPatients.map((patient) => (
                                        <SelectItem key={patient.id} value={patient.id}>
                                            {patient.name} - {patient.diagnosis}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name *</Label>
                                <Input
                                    id="fullName"
                                    value={formData.full_name}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="age">Age *</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth *</Label>
                                <Input
                                    id="dob"
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sex">Sex *</Label>
                                <Select
                                    value={formData.sex}
                                    onValueChange={(v) => handleInputChange('sex', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Address *</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nhis">NHIS Insurance Status *</Label>
                                <Select
                                    value={formData.nhis_status}
                                    onValueChange={(v) => handleInputChange('nhis_status', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Expired">Expired</SelectItem>
                                        <SelectItem value="None">None</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Clinical Details Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Clinical Details</CardTitle>
                        <CardDescription>Provide clinical information for the referral</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="complaint">Presenting Complaint *</Label>
                            <Textarea
                                id="complaint"
                                value={formData.presenting_complaint}
                                onChange={(e) => handleInputChange('presenting_complaint', e.target.value)}
                                placeholder="Describe the patient's presenting complaint"
                                rows={3}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="history">Clinical History</Label>
                            <Textarea
                                id="history"
                                value={formData.clinical_history}
                                onChange={(e) => handleInputChange('clinical_history', e.target.value)}
                                placeholder="Relevant medical history"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="examination">Examination Findings</Label>
                                <Textarea
                                    id="examination"
                                    value={formData.examination_findings}
                                    onChange={(e) => handleInputChange('examination_findings', e.target.value)}
                                    placeholder="Physical examination findings"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="investigations">Investigations Done & Results</Label>
                                <Textarea
                                    id="investigations"
                                    value={formData.investigations_results}
                                    onChange={(e) => handleInputChange('investigations_results', e.target.value)}
                                    placeholder="Lab tests, imaging, etc."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="diagnosis">Diagnosis *</Label>
                            <Input
                                id="diagnosis"
                                value={formData.diagnosis}
                                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="treatment">Treatment Given</Label>
                            <Textarea
                                id="treatment"
                                value={formData.treatment_given}
                                onChange={(e) => handleInputChange('treatment_given', e.target.value)}
                                placeholder="Treatment provided so far"
                                rows={2}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Referral Details Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Referral Details</CardTitle>
                        <CardDescription>Specify referral reason and urgency</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Referral *</Label>
                            <Textarea
                                id="reason"
                                value={formData.reason_for_referral}
                                onChange={(e) => handleInputChange('reason_for_referral', e.target.value)}
                                placeholder="Why is this referral needed?"
                                rows={3}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="urgency">Urgency of Referral *</Label>
                                <Select
                                    value={formData.urgency}
                                    onValueChange={(v) => handleInputChange('urgency', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Routine">Routine</SelectItem>
                                        <SelectItem value="Urgent">Urgent</SelectItem>
                                        <SelectItem value="Emergency">Emergency</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="datetime">Date and Time of Referral *</Label>
                                <Input
                                    id="datetime"
                                    type="datetime-local"
                                    value={formData.referral_datetime}
                                    onChange={(e) => handleInputChange('referral_datetime', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Referring Facility Section (Auto-populated) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Referring Facility & Clinician</CardTitle>
                        <CardDescription>Auto-populated from your profile</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Facility Name</p>
                                <p className="font-medium">Downtown Medical Clinic</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Address</p>
                                <p className="font-medium">456 Central Ave, Accra</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Telephone</p>
                                <p className="font-medium">+233 24 123 4567</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Clinician Name</p>
                                <p className="font-medium">Dr. Sarah Johnson</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Hospital Selection Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Hospital Selection</CardTitle>
                        <CardDescription>Get algorithm-based hospital recommendations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedHospital ? (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-green-800">{selectedHospital.hospital.name}</p>
                                        <p className="text-sm text-green-600">
                                            {selectedHospital.match_score}% match • {selectedHospital.distance_km} km away
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowRecommendations(true)}
                                    >
                                        Change
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Input
                                    placeholder="Enter hospital name"
                                    className="flex-1"
                                    value={formData.hospital_id || ''}
                                    onChange={(e) => handleInputChange('hospital_id', e.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGetRecommendations}
                                    className="whitespace-nowrap"
                                >
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Get Recommendations
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <Link href="/physician">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={loading || !selectedHospital}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Referral'
                        )}
                    </Button>
                </div>
            </form>

            {/* Recommendations Modal */}
            <RecommendationsModal
                open={showRecommendations}
                onClose={() => setShowRecommendations(false)}
                recommendations={mockRecommendations}
                onSelect={handleSelectHospital}
            />
        </div>
    );
}

export default function ReferralFormPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        }>
            <ReferralFormContent />
        </Suspense>
    );
}
