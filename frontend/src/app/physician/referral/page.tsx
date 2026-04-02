'use client';

import { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RecommendationsModal } from '@/components/physician/recommendations-modal';
import { patientsApi, hospitalsApi, referralsApi, resourcesApi, recommendApi } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast-provider';
import { useAuth } from '@/hooks/use-auth';
import { ReferralFormData, Patient, Hospital, EngineRecommendation, EngineResponse, ReferralReason } from '@/types';
import { ArrowLeft, TrendingUp, Loader2, Search, Building2, Bed, Heart, Users, CheckCircle, X, AlertTriangle, Paperclip, Upload } from 'lucide-react';
import Link from 'next/link';

// Maps referral_reason values to user-friendly labels
const EMERGENCY_TYPE_LABELS: Record<ReferralReason, string> = {
    cardiac: 'Cardiac (Heart)',
    trauma: 'Trauma (Injury)',
    respiratory: 'Respiratory (Breathing)',
    stroke: 'Stroke (Neurological)',
    obstetric: 'Obstetric (Maternity)',
    seizure: 'Seizure (Neurological)',
    general: 'General',
};

function ReferralFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const toast = useToast();
    const preselectedPatientId = searchParams.get('patientId') || searchParams.get('patient');

    const [showRecommendations, setShowRecommendations] = useState(false);
    const [selectedRecommendation, setSelectedRecommendation] = useState<EngineRecommendation | null>(null);
    const [engineResponse, setEngineResponse] = useState<EngineResponse | null>(null);
    const [engineLoading, setEngineLoading] = useState(false);
    const [engineError, setEngineError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Hospital search state
    const [hospitalSearch, setHospitalSearch] = useState('');
    const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
    const [chosenHospital, setChosenHospital] = useState<Hospital | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Data from API
    const [allPatients, setAllPatients] = useState<Patient[]>([]);
    const [activeHospitals, setActiveHospitals] = useState<Hospital[]>([]);
    const [hospitalResources, setHospitalResources] = useState<Record<string, unknown>[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    // File upload state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<string>('');

    // Load patients and hospitals from API on mount
    useEffect(() => {
        Promise.all([
            patientsApi.list().catch(() => []),
            hospitalsApi.list('active').catch(() => []),
        ]).then(([pats, hosps]) => {
            setAllPatients(pats as unknown as Patient[]);
            setActiveHospitals(hosps as unknown as Hospital[]);
        }).finally(() => setDataLoading(false));
    }, []);

    const filteredHospitals = useMemo(() => {
        // Exclude the physician's own hospital (can't refer to yourself)
        const myHospitalId = String(user?.hospital_id || '');
        const eligible = activeHospitals.filter(h => String(h.id) !== myHospitalId);
        if (!hospitalSearch) return eligible;
        return eligible.filter(h =>
            h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
            h.address.toLowerCase().includes(hospitalSearch.toLowerCase())
        );
    }, [hospitalSearch, activeHospitals, user?.hospital_id]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowHospitalDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Find preselected patient
    const preselectedPatient = preselectedPatientId
        ? allPatients.find(p => String(p.id) === String(preselectedPatientId))
        : null;

    const getAge = (dob?: string) => {
        if (!dob) return 0;
        const today = new Date();
        const birth = new Date(dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const [formData, setFormData] = useState<Partial<ReferralFormData>>({
        patient_id: preselectedPatient?.id || '',
        full_name: preselectedPatient?.full_name || '',
        date_of_birth: preselectedPatient?.date_of_birth || '',
        sex: preselectedPatient?.sex || 'male',
        address: preselectedPatient?.address || '',
        nhis_number: preselectedPatient?.nhis_number || '',
        nhis_status: preselectedPatient?.nhis_status || 'None',
        contact_number: preselectedPatient?.contact_number || '',
        presenting_complaint: preselectedPatient?.diagnosis || '',
        clinical_history: '',
        examination_findings: '',
        working_diagnosis: preselectedPatient?.diagnosis || '',
        investigations_done: '',
        treatment_given: '',
        reason_for_referral: '',
        referral_reason: 'general',
        urgency_level: 'routine',
        known_allergies: '',
        pre_existing_conditions: '',
        severity: 'medium',
        stability: 'stable',
        referral_datetime: new Date().toISOString().slice(0, 16),
        vital_signs: {
            temperature: undefined,
            pulse: undefined,
            respiratory_rate: undefined,
            blood_pressure_systolic: undefined,
            blood_pressure_diastolic: undefined,
            spO2: undefined,
            gcs: undefined,
        },
    });

    // Auto-select patient when data loads
    useEffect(() => {
        if (preselectedPatientId && allPatients.length > 0 && String(formData.patient_id) !== String(preselectedPatientId)) {
            handlePatientSelect(String(preselectedPatientId));
        }
    }, [allPatients, preselectedPatientId]);

    const handlePatientSelect = (patientId: string) => {
        if (patientId === '-1') {
            setFormData({
                ...formData,
                patient_id: '-1',
                full_name: '',
                date_of_birth: '',
                sex: 'male',
                address: '',
                nhis_number: '',
                nhis_status: 'None',
                contact_number: '',
                presenting_complaint: '',
                working_diagnosis: '',
            });
            return;
        }

        const patient = allPatients.find(p => String(p.id) === String(patientId));
        if (patient) {
            setFormData({
                ...formData,
                patient_id: String(patient.id),
                full_name: patient.full_name,
                date_of_birth: patient.date_of_birth || '',
                sex: patient.sex || 'male',
                address: patient.address || '',
                nhis_number: patient.nhis_number || '',
                nhis_status: patient.nhis_status || 'None',
                contact_number: patient.contact_number || '',
                presenting_complaint: patient.diagnosis || '',
                working_diagnosis: patient.diagnosis || '',
            });
        }
    };

    const handleInputChange = (field: keyof ReferralFormData, value: string | number | undefined) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleVitalChange = (field: keyof Required<ReferralFormData>['vital_signs'], value: string) => {
        setFormData(prev => ({
            ...prev,
            vital_signs: {
                ...prev.vital_signs,
                [field]: value === '' ? undefined : Number(value)
            }
        }));
    };

    const handleHospitalSelect = (hospital: Hospital) => {
        setChosenHospital(hospital);
        setHospitalSearch('');
        setShowHospitalDropdown(false);
        setFormData({ ...formData, receiving_hospital_id: hospital.id });
        setSelectedRecommendation(null);
    };

    const handleClearHospital = () => {
        setChosenHospital(null);
        setSelectedRecommendation(null);
        setFormData({ ...formData, receiving_hospital_id: undefined });
    };

    // --- Core integration: call the referral engine API ---
    const handleGetRecommendations = async () => {
        setShowRecommendations(true);
        setEngineLoading(true);
        setEngineError(null);
        setEngineResponse(null);

        try {
            // Use the referring physician's hospital GPS as patient location
            const referringHospitalGps = { lat: 5.5913, lng: -0.1786 };

            const payload = {
                lat: referringHospitalGps.lat,
                lon: referringHospitalGps.lng,
                referral_reason: (formData.referral_reason || 'general') as ReferralReason,
                severity: formData.severity || 'medium',
                stability: formData.stability || 'stable',
                referring_hospital_id: user?.hospital_id ? parseInt(user.hospital_id) : undefined,
            };
            console.log('[HRS] Recommend request:', JSON.stringify(payload));

            const response = await recommendApi.rank(payload);

            setEngineResponse(response);
        } catch (err) {
            console.error('Engine API error:', err);
            // Surface the actual error type for debugging
            const errorMsg = err instanceof TypeError
                ? `Network error: ${err.message}. Check browser console Network tab for details.`
                : err instanceof Error
                    ? err.message
                    : 'Could not reach the referral engine.';
            setEngineError(errorMsg);
        } finally {
            setEngineLoading(false);
        }
    };

    const handleSelectRecommendation = (recommendation: EngineRecommendation) => {
        setSelectedRecommendation(recommendation);
        // Find matching hospital from frontend data for the preview card
        const matchedHospital = activeHospitals.find(
            h => h.name === recommendation.hospital_name
        );
        if (matchedHospital) {
            setChosenHospital(matchedHospital);
            setFormData({ ...formData, receiving_hospital_id: matchedHospital.id });
        } else {
            // Hospital from engine not in frontend mock data — use engine data directly
            setChosenHospital(null);
            setFormData({ ...formData, receiving_hospital_id: recommendation.hospital_id });
        }
        setShowRecommendations(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.patient_id) {
            toast.warning('Please select a patient before submitting the referral.');
            setLoading(false);
            return;
        }

        if (!formData.receiving_hospital_id) {
            toast.warning('Please select a receiving hospital.');
            setLoading(false);
            return;
        }

        if (!user || (!user.physician_id && !user.id) || !user.hospital_id) {
            toast.error('User profile information is incomplete. Please log in again.');
            setLoading(false);
            return;
        }

        if (String(formData.receiving_hospital_id) === String(user?.hospital_id)) {
            toast.warning('You cannot refer a patient to your own hospital. Please select a different receiving hospital.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                patient_id: parseInt(String(formData.patient_id)),
                referring_physician_id: parseInt(String(user?.physician_id || user?.id)),
                referring_hospital_id: parseInt(String(user?.hospital_id)),
                receiving_hospital_id: parseInt(String(formData.receiving_hospital_id)),
                referral_reason: formData.referral_reason,
                severity: formData.severity,
                stability: formData.stability,
                urgency_level: formData.urgency_level,
                known_allergies: formData.known_allergies,
                pre_existing_conditions: formData.pre_existing_conditions,
                presenting_complaint: formData.presenting_complaint,
                clinical_history: formData.clinical_history,
                examination_findings: formData.examination_findings,
                working_diagnosis: formData.working_diagnosis,
                investigations_done: formData.investigations_done,
                treatment_given: formData.treatment_given,
                reason_for_referral: formData.reason_for_referral,
                vital_signs: formData.vital_signs,
                patient_details: formData.patient_id === '-1' ? {
                    patient_identifier: `PAT-${Date.now()}`,
                    full_name: formData.full_name,
                    date_of_birth: formData.date_of_birth,
                    sex: formData.sex,
                    address: formData.address,
                    contact_number: formData.contact_number,
                    nhis_number: formData.nhis_number,
                    nhis_status: formData.nhis_status,
                    hospital_id: user?.hospital_id,
                    physician_id: user?.physician_id || user?.id,
                } : undefined,
            };
            const result = await referralsApi.create(payload);

            // Upload attachments if any
            if (selectedFiles.length > 0 && result.referral_id) {
                setUploadProgress('Uploading attachments...');
                for (const file of selectedFiles) {
                    try {
                        await referralsApi.uploadAttachment(result.referral_id, file);
                    } catch (uploadErr) {
                        console.error('Failed to upload attachment:', file.name, uploadErr);
                    }
                }
                setUploadProgress('');
            }

            toast.success('Referral submitted successfully!');
            router.push('/physician');
        } catch (err) {
            console.error('Failed to create referral:', err);
            toast.error('Failed to submit referral. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get hospital status preview data
    // Load resources when a hospital is chosen
    useEffect(() => {
        if (chosenHospital?.id) {
            resourcesApi.list(chosenHospital.id)
                .then(setHospitalResources)
                .catch(() => setHospitalResources([]));
        }
    }, [chosenHospital?.id]);

    const getHospitalPreview = (hospital: Hospital) => {
        const generalBeds = hospitalResources.find((r: Record<string, unknown>) => r.resource_type === 'general_beds');
        const icuBeds = hospitalResources.find((r: Record<string, unknown>) => r.resource_type === 'icu_beds');

        return {
            generalBeds: generalBeds ? `${generalBeds.available_count}/${generalBeds.total_count}` : 'N/A',
            icuBeds: icuBeds ? `${icuBeds.available_count}/${icuBeds.total_count}` : 'N/A',
            level: (hospital.level || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            ownership: hospital.ownership.replace('_', ' ').charAt(0).toUpperCase() + hospital.ownership.replace('_', ' ').slice(1),
        };
    };

    const URGENCY_TRIGGER_STYLE: Record<string, string> = {
        routine: 'border-l-4 border-l-green-500',
        urgent: 'border-l-4 border-l-amber-500',
        emergency: 'border-l-4 border-l-red-600',
    };

    const SEVERITY_TRIGGER_STYLE: Record<string, string> = {
        critical: 'border-l-4 border-l-red-600',
        high: 'border-l-4 border-l-orange-500',
        medium: 'border-l-4 border-l-yellow-500',
        low: 'border-l-4 border-l-green-500',
    };

    const STABILITY_TRIGGER_STYLE: Record<string, string> = {
        stable: 'border-l-4 border-l-green-500',
        unstable: 'border-l-4 border-l-red-600',
    };

    const getLevelBadgeStyle = (level: string) => {
        const styles: Record<string, string> = {
            teaching: 'bg-purple-100 text-purple-700 border-purple-200',
            regional: 'bg-sky-100 text-sky-700 border-sky-200',
            district: 'bg-blue-100 text-blue-700 border-blue-200',
            polyclinic: 'bg-teal-100 text-teal-700 border-teal-200',
            health_centre: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            chps: 'bg-slate-100 text-slate-700 border-slate-200',
        };
        return styles[level] || styles.district;
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
                        <div className="space-y-2">
                            <Label htmlFor="patient">Select Patient</Label>
                            <Select
                                value={String(formData.patient_id || '')}
                                onValueChange={handlePatientSelect}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a patient or Create New" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="-1" className="font-semibold text-primary">
                                        + Create New Patient
                                    </SelectItem>
                                    {allPatients.map((patient) => (
                                        <SelectItem key={patient.id} value={String(patient.id)}>
                                            {patient.full_name} — {patient.patient_identifier}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <fieldset disabled={formData.patient_id !== '-1'} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="fullName"
                                    value={formData.full_name}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth <span className="text-red-500">*</span></Label>
                                <Input
                                    id="dob"
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sex">Sex <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.sex}
                                    onValueChange={(v) => handleInputChange('sex', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact">Contact Number</Label>
                                <Input
                                    id="contact"
                                    value={formData.contact_number}
                                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nhis_number">NHIS Number</Label>
                                <Input
                                    id="nhis_number"
                                    value={formData.nhis_number}
                                    onChange={(e) => handleInputChange('nhis_number', e.target.value)}
                                    placeholder="e.g. NHIS-100234"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nhis_status">NHIS Insurance Status <span className="text-red-500">*</span></Label>
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
                        </fieldset>
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
                            <Label htmlFor="complaint">Presenting Complaint <span className="text-red-500">*</span></Label>
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
                                    value={formData.investigations_done}
                                    onChange={(e) => handleInputChange('investigations_done', e.target.value)}
                                    placeholder="Lab tests, imaging, etc."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="diagnosis">Working Diagnosis <span className="text-red-500">*</span></Label>
                            <Input
                                id="diagnosis"
                                value={formData.working_diagnosis}
                                onChange={(e) => handleInputChange('working_diagnosis', e.target.value)}
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

                {/* Vital Signs & Initial Measurements Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Vital Signs & Location</CardTitle>
                        <CardDescription>Record patient vitals and optionally override incident location</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="temp">Temp (°C)</Label>
                                <Input
                                    id="temp"
                                    type="number"
                                    step="0.1"
                                    value={formData.vital_signs?.temperature ?? ''}
                                    onChange={(e) => handleVitalChange('temperature', e.target.value)}
                                    placeholder="37.0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pulse">Pulse (bpm)</Label>
                                <Input
                                    id="pulse"
                                    type="number"
                                    value={formData.vital_signs?.pulse ?? ''}
                                    onChange={(e) => handleVitalChange('pulse', e.target.value)}
                                    placeholder="80"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="respRate">Resp Rate (/min)</Label>
                                <Input
                                    id="respRate"
                                    type="number"
                                    value={formData.vital_signs?.respiratory_rate ?? ''}
                                    onChange={(e) => handleVitalChange('respiratory_rate', e.target.value)}
                                    placeholder="16"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="spo2">SpO2 (%)</Label>
                                <Input
                                    id="spo2"
                                    type="number"
                                    value={formData.vital_signs?.spO2 ?? ''}
                                    onChange={(e) => handleVitalChange('spO2', e.target.value)}
                                    placeholder="98"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bpSys">BP Sys (mmHg)</Label>
                                <Input
                                    id="bpSys"
                                    type="number"
                                    value={formData.vital_signs?.blood_pressure_systolic ?? ''}
                                    onChange={(e) => handleVitalChange('blood_pressure_systolic', e.target.value)}
                                    placeholder="120"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bpDia">BP Dia (mmHg)</Label>
                                <Input
                                    id="bpDia"
                                    type="number"
                                    value={formData.vital_signs?.blood_pressure_diastolic ?? ''}
                                    onChange={(e) => handleVitalChange('blood_pressure_diastolic', e.target.value)}
                                    placeholder="80"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gcs">GCS Score</Label>
                                <Input
                                    id="gcs"
                                    type="number"
                                    min="3" max="15"
                                    value={formData.vital_signs?.gcs ?? ''}
                                    onChange={(e) => handleVitalChange('gcs', e.target.value)}
                                    placeholder="15"
                                />
                            </div>
                        </div>

                        <Separator className="my-6" />
                        
                        {/* Clinical Additional Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="known_allergies">Known Allergies (Optional)</Label>
                                <Input
                                    id="known_allergies"
                                    value={formData.known_allergies || ''}
                                    onChange={(e) => handleInputChange('known_allergies', e.target.value)}
                                    placeholder="e.g. Penicillin, Peanuts"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pre_existing_conditions">Pre-existing Conditions / Comorbidities (Optional)</Label>
                                <Input
                                    id="pre_existing_conditions"
                                    value={formData.pre_existing_conditions || ''}
                                    onChange={(e) => handleInputChange('pre_existing_conditions', e.target.value)}
                                    placeholder="e.g. Type 2 Diabetes, Hypertension"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Referral Details Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Referral Details</CardTitle>
                        <CardDescription>Specify referral reason, severity, and stability — these drive the hospital recommendation algorithm</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Referral <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="reason"
                                value={formData.reason_for_referral}
                                onChange={(e) => handleInputChange('reason_for_referral', e.target.value)}
                                placeholder="Why is this referral needed?"
                                rows={3}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Referral Reason — feeds directly into the algorithm */}
                            <div className="space-y-2">
                                <Label htmlFor="referral_reason">Referral Reason <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.referral_reason}
                                    onValueChange={(v) => handleInputChange('referral_reason', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(Object.entries(EMERGENCY_TYPE_LABELS) as [ReferralReason, string][]).map(
                                            ([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="urgency_level">Urgency Level <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.urgency_level}
                                    onValueChange={(v) => handleInputChange('urgency_level', v)}
                                >
                                    <SelectTrigger className={URGENCY_TRIGGER_STYLE[formData.urgency_level || 'routine']}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="routine"><span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>Routine</span></SelectItem>
                                        <SelectItem value="urgent"><span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>Urgent</span></SelectItem>
                                        <SelectItem value="emergency"><span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-red-600"></span>Emergency</span></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="severity">Severity <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.severity}
                                    onValueChange={(v) => handleInputChange('severity', v)}
                                >
                                    <SelectTrigger className={SEVERITY_TRIGGER_STYLE[formData.severity || 'medium']}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="critical"><span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-red-600"></span>Critical</span></SelectItem>
                                        <SelectItem value="high"><span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>High</span></SelectItem>
                                        <SelectItem value="medium"><span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>Medium</span></SelectItem>
                                        <SelectItem value="low"><span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>Low</span></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stability">Patient Stability <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.stability}
                                    onValueChange={(v) => handleInputChange('stability', v)}
                                >
                                    <SelectTrigger className={STABILITY_TRIGGER_STYLE[formData.stability || 'stable']}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="stable"><span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>Stable</span></SelectItem>
                                        <SelectItem value="unstable"><span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-red-600"></span>Unstable</span></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="datetime">Date and Time <span className="text-red-500">*</span></Label>
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
                                <p className="font-medium">{user?.hospital_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Address</p>
                                <p className="font-medium">{user?.hospital_address || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Telephone</p>
                                <p className="font-medium">{user?.contact_phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Clinician Name</p>
                                <p className="font-medium">{user?.full_name || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Hospital Selection Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Receiving Hospital</CardTitle>
                        <CardDescription>
                            Search for a hospital or get algorithm-based recommendations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Engine error banner */}
                        {engineError && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">Engine Error</p>
                                    <p>{engineError}</p>
                                </div>
                            </div>
                        )}

                        {/* Show chosen hospital with status preview */}
                        {(chosenHospital || selectedRecommendation) ? (
                            <div className="space-y-4">
                                {/* Selected Hospital Card */}
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="font-semibold text-green-800">
                                                    {chosenHospital?.name || selectedRecommendation?.hospital_name}
                                                </p>
                                                {chosenHospital && (
                                                    <p className="text-sm text-green-600">
                                                        {chosenHospital.address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearHospital}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Hospital Status Preview */}
                                    {chosenHospital && (
                                        <div className="mt-3 pt-3 border-t border-green-200">
                                            <p className="text-xs font-medium text-green-700 mb-2">CURRENT STATUS</p>
                                            {(() => {
                                                const preview = getHospitalPreview(chosenHospital);
                                                return (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        <div className="bg-white rounded-md p-2 text-center">
                                                            <Bed className="h-4 w-4 text-primary/80 mx-auto mb-1" />
                                                            <p className="text-xs text-gray-500">General Beds</p>
                                                            <p className="font-semibold text-sm">{preview.generalBeds}</p>
                                                        </div>
                                                        <div className="bg-white rounded-md p-2 text-center">
                                                            <Heart className="h-4 w-4 text-red-500 mx-auto mb-1" />
                                                            <p className="text-xs text-gray-500">ICU Beds</p>
                                                            <p className="font-semibold text-sm">{preview.icuBeds}</p>
                                                        </div>
                                                        <div className="bg-white rounded-md p-2 text-center">
                                                            <Building2 className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                                                            <p className="text-xs text-gray-500">Level</p>
                                                            <p className="font-semibold text-sm">{preview.level}</p>
                                                        </div>
                                                        <div className="bg-white rounded-md p-2 text-center">
                                                            <Badge className={`text-xs ${getLevelBadgeStyle(chosenHospital.level)}`} variant="outline">
                                                                {preview.level}
                                                            </Badge>
                                                            <p className="text-xs text-gray-500 mt-1">{preview.ownership}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {/* Engine score if from recommendations */}
                                    {selectedRecommendation && (
                                        <div className="mt-2 flex items-center gap-3 text-sm text-green-600">
                                            <span>
                                                {Math.round(selectedRecommendation.composite_score * 100)}% match
                                            </span>
                                            <span>•</span>
                                            <span>{selectedRecommendation.distance_km} km away</span>
                                            <span>•</span>
                                            <span>{selectedRecommendation.travel_time_minutes} min travel</span>
                                        </div>
                                    )}
                                </div>

                                {/* Get Recommendations Button (always visible) */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGetRecommendations}
                                    className="w-full"
                                >
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    View Algorithm Recommendations (Top 5)
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Searchable Hospital Input */}
                                <div className="relative" ref={dropdownRef}>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search hospitals by name or location..."
                                            value={hospitalSearch}
                                            onChange={(e) => {
                                                setHospitalSearch(e.target.value);
                                                setShowHospitalDropdown(true);
                                            }}
                                            onFocus={() => setShowHospitalDropdown(true)}
                                            className="pl-9"
                                        />
                                    </div>

                                    {/* Dropdown */}
                                    {showHospitalDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                            {filteredHospitals.length === 0 ? (
                                                <div className="p-3 text-sm text-gray-500 text-center">
                                                    No hospitals found
                                                </div>
                                            ) : (
                                                filteredHospitals.map((hospital) => {
                                                    const preview = getHospitalPreview(hospital);
                                                    return (
                                                        <button
                                                            key={hospital.id}
                                                            type="button"
                                                            className="w-full px-4 py-3 text-left hover:bg-[#C4D8E5]/30 border-b last:border-b-0 transition-colors"
                                                            onClick={() => handleHospitalSelect(hospital)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{hospital.name}</p>
                                                                    <p className="text-xs text-gray-500">{hospital.address}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className={`text-xs ${getLevelBadgeStyle(hospital.level)}`} variant="outline">
                                                                        {preview.level}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                                                <span>Beds: {preview.generalBeds}</span>
                                                                <span>ICU: {preview.icuBeds}</span>
                                                                <span className="capitalize">{hospital.level?.replace('_', ' ')}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Get Recommendations */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                    <span className="text-xs text-gray-400">or</span>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGetRecommendations}
                                    className="w-full"
                                >
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Get Algorithm Recommendations (Top 5)
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* File Attachments Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Attachments</CardTitle>
                        <CardDescription>Attach supporting documents (PDF, JPG, PNG — max 10MB each)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-[#C4D8E5]/30'); }}
                            onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-400', 'bg-[#C4D8E5]/30'); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-blue-400', 'bg-[#C4D8E5]/30');
                                const files = Array.from(e.dataTransfer.files).filter(f => {
                                    const ext = f.name.split('.').pop()?.toLowerCase();
                                    return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext || '') && f.size <= 10 * 1024 * 1024;
                                });
                                setSelectedFiles(prev => [...prev, ...files]);
                            }}
                        >
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Click to browse or drag files here</p>
                            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, WebP • Max 10MB per file</p>
                        </div>
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="hidden"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []).filter(f => f.size <= 10 * 1024 * 1024);
                                setSelectedFiles(prev => [...prev, ...files]);
                                e.target.value = '';
                            }}
                        />
                        {selectedFiles.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {selectedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm">
                                        <div className="flex items-center gap-2">
                                            <Paperclip className="h-4 w-4 text-gray-400" />
                                            <span>{file.name}</span>
                                            <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {uploadProgress && (
                            <p className="text-sm text-primary mt-2 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {uploadProgress}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <Link href="/physician">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={loading || (!chosenHospital && !selectedRecommendation)}>
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

            {/* Recommendations Modal — now powered by the real engine */}
            <RecommendationsModal
                open={showRecommendations}
                onClose={() => setShowRecommendations(false)}
                recommendations={engineResponse?.recommendations || []}
                warnings={engineResponse?.warnings || []}
                onSelect={handleSelectRecommendation}
                loading={engineLoading}
            />
        </div>
    );
}

export default function ReferralFormPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ReferralFormContent />
        </Suspense>
    );
}
