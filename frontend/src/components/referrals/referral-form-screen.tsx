'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Bed, Building2, CheckCircle, Heart, Loader2, Paperclip, Search, TrendingUp, Upload, Users, X } from 'lucide-react';
import { RecommendationsModal } from '@/components/physician/recommendations-modal';
import { VoiceReferralCard } from '@/components/referrals/voice-referral-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast-provider';
import { clearStoredAiReferralDraft, readStoredAiReferralDraft, StoredAiReferralDraft } from '@/hooks/use-ai-referral-intake';
import { useAuth } from '@/hooks/use-auth';
import { hospitalsApi, patientsApi, recommendApi, referralsApi, resourcesApi, usersApi } from '@/lib/api-client';
import {
    EngineRecommendation,
    EngineResponse,
    Hospital,
    Patient,
    Physician,
    ReferralFormData,
    ReferralReason,
} from '@/types';

const EMERGENCY_TYPE_LABELS: Record<ReferralReason, string> = {
    cardiac: 'Cardiac (Heart)',
    trauma: 'Trauma (Injury)',
    respiratory: 'Respiratory (Breathing)',
    stroke: 'Stroke (Neurological)',
    obstetric: 'Obstetric (Maternity)',
    seizure: 'Seizure (Neurological)',
    general: 'General',
};

const URGENCY_BADGE_STYLES: Record<string, string> = {
    routine: 'bg-green-50 text-green-700 border-green-200',
    urgent: 'bg-amber-50 text-amber-700 border-amber-200',
    emergency: 'bg-red-50 text-red-700 border-red-200',
};

const SEVERITY_BADGE_STYLES: Record<string, string> = {
    low: 'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
};

const STABILITY_BADGE_STYLES: Record<string, string> = {
    stable: 'bg-green-50 text-green-700 border-green-200',
    unstable: 'bg-red-50 text-red-700 border-red-200',
};

const URGENCY_TRIGGER_STYLES: Record<string, string> = {
    routine: 'border-green-200 bg-white text-green-800 shadow-[inset_4px_0_0_0_#22c55e]',
    urgent: 'border-amber-200 bg-white text-amber-800 shadow-[inset_4px_0_0_0_#f59e0b]',
    emergency: 'border-red-200 bg-white text-red-800 shadow-[inset_4px_0_0_0_#ef4444]',
};

const SEVERITY_TRIGGER_STYLES: Record<string, string> = {
    low: 'border-green-200 bg-white text-green-800 shadow-[inset_4px_0_0_0_#22c55e]',
    medium: 'border-amber-200 bg-white text-amber-800 shadow-[inset_4px_0_0_0_#f59e0b]',
    high: 'border-orange-200 bg-white text-orange-800 shadow-[inset_4px_0_0_0_#f97316]',
    critical: 'border-red-200 bg-white text-red-800 shadow-[inset_4px_0_0_0_#ef4444]',
};

const STABILITY_TRIGGER_STYLES: Record<string, string> = {
    stable: 'border-green-200 bg-white text-green-800 shadow-[inset_4px_0_0_0_#22c55e]',
    unstable: 'border-red-200 bg-white text-red-800 shadow-[inset_4px_0_0_0_#ef4444]',
};

const STATUS_DOT_STYLES: Record<string, string> = {
    routine: 'bg-green-500',
    urgent: 'bg-amber-500',
    emergency: 'bg-red-500',
    low: 'bg-green-500',
    medium: 'bg-amber-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
    stable: 'bg-green-500',
    unstable: 'bg-red-500',
};

const VALID_REFERRAL_REASONS: ReferralReason[] = ['cardiac', 'trauma', 'respiratory', 'stroke', 'obstetric', 'seizure', 'general'];

type ReferralFormMode = 'physician' | 'hospital_admin';

interface ReferralFormScreenProps {
    mode: ReferralFormMode;
    backHref: string;
    submitRedirectHref: string;
}

function RequiredLabel({ htmlFor, children, required = false }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
    return (
        <Label htmlFor={htmlFor} className="flex items-center gap-1">
            <span>{children}</span>
            {required && <span className="text-red-500">*</span>}
        </Label>
    );
}

function StatusSelectValue({
    value,
    label,
}: {
    value: string;
    label: string;
}) {
    return (
        <span className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${STATUS_DOT_STYLES[value] || 'bg-slate-400'}`} />
            <span>{label}</span>
        </span>
    );
}

function ReferralFormScreenContent({ mode, backHref, submitRedirectHref }: ReferralFormScreenProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const toast = useToast();
    const preselectedPatientId = searchParams.get('patientId') || searchParams.get('patient');
    const autoOpenVoice = searchParams.get('voice') === '1';

    const [showRecommendations, setShowRecommendations] = useState(false);
    const [selectedRecommendation, setSelectedRecommendation] = useState<EngineRecommendation | null>(null);
    const [engineResponse, setEngineResponse] = useState<EngineResponse | null>(null);
    const [engineLoading, setEngineLoading] = useState(false);
    const [engineError, setEngineError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hospitalSearch, setHospitalSearch] = useState('');
    const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
    const [chosenHospital, setChosenHospital] = useState<Hospital | null>(null);
    const [allPatients, setAllPatients] = useState<Patient[]>([]);
    const [activeHospitals, setActiveHospitals] = useState<Hospital[]>([]);
    const [hospitalResources, setHospitalResources] = useState<Record<string, unknown>[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState('');
    const [availablePhysicians, setAvailablePhysicians] = useState<Physician[]>([]);
    const [selectedReferringPhysicianId, setSelectedReferringPhysicianId] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const draftAppliedRef = useRef(false);

    const [formData, setFormData] = useState<Partial<ReferralFormData>>({
        patient_id: '',
        full_name: '',
        date_of_birth: '',
        sex: 'male',
        address: '',
        nhis_number: '',
        nhis_status: 'None',
        contact_number: '',
        presenting_complaint: '',
        clinical_history: '',
        examination_findings: '',
        working_diagnosis: '',
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

    useEffect(() => {
        Promise.all([
            patientsApi.list().catch(() => []),
            hospitalsApi.list('active').catch(() => []),
            mode === 'hospital_admin' && user?.hospital_id
                ? usersApi.listPhysicians({ hospital_id: user.hospital_id, status: 'active' }).catch(() => [])
                : Promise.resolve([]),
        ]).then(([patients, hospitals, physicians]) => {
            setAllPatients(patients as Patient[]);
            setActiveHospitals(hospitals as Hospital[]);
            setAvailablePhysicians(physicians as Physician[]);

            if (mode === 'hospital_admin' && Array.isArray(physicians) && physicians.length > 0) {
                setSelectedReferringPhysicianId((physicians[0] as unknown as Physician).id);
            } else if (mode === 'physician' && user?.physician_id) {
                setSelectedReferringPhysicianId(user.physician_id);
            }
        });
    }, [mode, user?.hospital_id, user?.physician_id]);

    const selectedReferringPhysician = useMemo(
        () => availablePhysicians.find((physician) => physician.id === selectedReferringPhysicianId) || null,
        [availablePhysicians, selectedReferringPhysicianId],
    );

    const filteredHospitals = useMemo(() => {
        const myHospitalId = String(user?.hospital_id || '');
        const eligible = activeHospitals.filter((hospital) => String(hospital.id) !== myHospitalId);
        if (!hospitalSearch) {
            return eligible;
        }
        return eligible.filter(
            (hospital) =>
                hospital.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
                hospital.address.toLowerCase().includes(hospitalSearch.toLowerCase()),
        );
    }, [activeHospitals, hospitalSearch, user?.hospital_id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowHospitalDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const applyDraftToForm = (draft: StoredAiReferralDraft) => {
        const structured = draft.structured?.structured_data;
        if (!structured) {
            return;
        }

        setFormData((prev) => {
            const next = { ...prev };
            const isNewPatientDraft = prev.patient_id === '-1' || !prev.patient_id;

            if (isNewPatientDraft) {
                next.patient_id = '-1';
            }

            const assign = <K extends keyof typeof next>(key: K, value: typeof next[K]) => {
                if (value === null || value === undefined || value === '') {
                    return;
                }
                next[key] = value;
            };

            if (next.patient_id === '-1' || !next.patient_id) {
                assign('full_name', structured.full_name || undefined);
                assign('date_of_birth', structured.date_of_birth || undefined);
                assign('sex', structured.sex || undefined);
                assign('address', structured.address || undefined);
                assign('nhis_number', structured.nhis_number || undefined);
                assign('nhis_status', structured.nhis_status || undefined);
                assign('contact_number', structured.contact_number || undefined);
            }

            assign('presenting_complaint', structured.presenting_complaint || undefined);
            assign('clinical_history', structured.clinical_history || undefined);
            assign('examination_findings', structured.examination_findings || undefined);
            assign('working_diagnosis', structured.working_diagnosis || undefined);
            assign('investigations_done', structured.investigations_done || undefined);
            assign('treatment_given', structured.treatment_given || undefined);
            assign('reason_for_referral', structured.reason_for_referral || undefined);
            assign('referral_reason', structured.referral_reason || undefined);
            assign('urgency_level', structured.urgency_level || undefined);
            assign('severity', structured.severity || undefined);
            assign('stability', structured.stability || undefined);
            assign('known_allergies', structured.known_allergies || undefined);
            assign('pre_existing_conditions', structured.pre_existing_conditions || undefined);

            if (structured.vital_signs) {
                next.vital_signs = {
                    ...next.vital_signs,
                    ...structured.vital_signs,
                };
            }

            return next;
        });
    };

    useEffect(() => {
        if (draftAppliedRef.current) {
            return;
        }

        const storedDraft = readStoredAiReferralDraft();
        if (storedDraft?.structured) {
            applyDraftToForm(storedDraft);
            draftAppliedRef.current = true;
        }
    }, []);

    useEffect(() => {
        if (preselectedPatientId && allPatients.length > 0) {
            const patient = allPatients.find((entry) => String(entry.id) === String(preselectedPatientId));
            if (patient) {
                setFormData((prev) => ({
                    ...prev,
                    patient_id: String(patient.id),
                    full_name: patient.full_name,
                    date_of_birth: patient.date_of_birth || '',
                    sex: patient.sex || 'male',
                    address: patient.address || '',
                    nhis_number: patient.nhis_number || '',
                    nhis_status: patient.nhis_status || 'None',
                    contact_number: patient.contact_number || '',
                    presenting_complaint: prev.presenting_complaint || patient.diagnosis || '',
                    working_diagnosis: prev.working_diagnosis || patient.diagnosis || '',
                }));
            }
        }
    }, [allPatients, preselectedPatientId]);

    useEffect(() => {
        if (chosenHospital?.id) {
            resourcesApi.list(chosenHospital.id)
                .then(setHospitalResources)
                .catch(() => setHospitalResources([]));
        }
    }, [chosenHospital?.id]);

    const handlePatientSelect = (patientId: string) => {
        if (patientId === '-1') {
            setFormData((prev) => ({
                ...prev,
                patient_id: '-1',
                full_name: prev.full_name || '',
                date_of_birth: prev.date_of_birth || '',
                sex: prev.sex || 'male',
                address: prev.address || '',
                nhis_number: prev.nhis_number || '',
                nhis_status: prev.nhis_status || 'None',
                contact_number: prev.contact_number || '',
            }));
            return;
        }

        const patient = allPatients.find((entry) => String(entry.id) === String(patientId));
        if (!patient) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            patient_id: String(patient.id),
            full_name: patient.full_name,
            date_of_birth: patient.date_of_birth || '',
            sex: patient.sex || 'male',
            address: patient.address || '',
            nhis_number: patient.nhis_number || '',
            nhis_status: patient.nhis_status || 'None',
            contact_number: patient.contact_number || '',
            presenting_complaint: prev.presenting_complaint || patient.diagnosis || '',
            working_diagnosis: prev.working_diagnosis || patient.diagnosis || '',
        }));
    };

    const handleInputChange = (field: keyof ReferralFormData, value: string | number | undefined) => {
        setFormData((prev) => {
            if (field === 'referral_reason') {
                const nextValue = typeof value === 'string' && VALID_REFERRAL_REASONS.includes(value as ReferralReason)
                    ? (value as ReferralReason)
                    : 'general';
                return { ...prev, [field]: nextValue };
            }
            return { ...prev, [field]: value };
        });
    };

    const handleVitalChange = (field: keyof Required<ReferralFormData>['vital_signs'], value: string) => {
        setFormData((prev) => ({
            ...prev,
            vital_signs: {
                ...prev.vital_signs,
                [field]: value === '' ? undefined : Number(value),
            },
        }));
    };

    const handleHospitalSelect = (hospital: Hospital) => {
        setChosenHospital(hospital);
        setHospitalSearch('');
        setShowHospitalDropdown(false);
        setSelectedRecommendation(null);
        setFormData((prev) => ({ ...prev, receiving_hospital_id: hospital.id }));
    };

    const handleClearHospital = () => {
        setChosenHospital(null);
        setSelectedRecommendation(null);
        setFormData((prev) => ({ ...prev, receiving_hospital_id: undefined }));
    };

    const handleGetRecommendations = async () => {
        setShowRecommendations(true);
        setEngineLoading(true);
        setEngineError(null);
        setEngineResponse(null);

        try {
            const payload = {
                lat: 5.5913,
                lon: -0.1786,
                referral_reason: (formData.referral_reason || 'general') as ReferralReason,
                severity: formData.severity || 'medium',
                stability: formData.stability || 'stable',
                referring_hospital_id: user?.hospital_id ? parseInt(user.hospital_id) : undefined,
            };
            const response = await recommendApi.rank(payload);
            setEngineResponse(response);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Could not reach the referral engine.';
            setEngineError(message);
        } finally {
            setEngineLoading(false);
        }
    };

    const handleSelectRecommendation = (recommendation: EngineRecommendation) => {
        setSelectedRecommendation(recommendation);
        const matchedHospital = activeHospitals.find(
            (hospital) => String(hospital.id) === String(recommendation.hospital_id),
        );
        if (matchedHospital) {
            setChosenHospital(matchedHospital);
            setFormData((prev) => ({ ...prev, receiving_hospital_id: matchedHospital.id }));
        } else {
            setChosenHospital(null);
            setFormData((prev) => ({ ...prev, receiving_hospital_id: recommendation.hospital_id }));
        }
        setShowRecommendations(false);
    };

    const validateRequiredFields = () => {
        const missing: string[] = [];
        const trimmed = (value?: string) => (value || '').trim();

        if (!formData.patient_id) {
            missing.push('Select Patient');
        }

        if (formData.patient_id === '-1') {
            if (!trimmed(formData.full_name)) missing.push('Full Name');
            if (!trimmed(formData.date_of_birth)) missing.push('Date of Birth');
            if (!trimmed(formData.sex)) missing.push('Sex');
            if (!trimmed(formData.address)) missing.push('Address');
        }

        if (!trimmed(formData.presenting_complaint)) missing.push('Presenting Complaint');
        if (!trimmed(formData.working_diagnosis)) missing.push('Working Diagnosis');
        if (!trimmed(formData.reason_for_referral)) missing.push('Reason for Referral');
        if (!trimmed(formData.referral_reason)) missing.push('Referral Reason');
        if (!trimmed(formData.urgency_level)) missing.push('Urgency');
        if (!trimmed(formData.severity)) missing.push('Severity');
        if (!trimmed(formData.stability)) missing.push('Stability');
        if (!trimmed(formData.referral_datetime)) missing.push('Date & Time');
        if (!formData.receiving_hospital_id) missing.push('Receiving Hospital');

        return missing;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        const referringPhysicianId = mode === 'hospital_admin'
            ? selectedReferringPhysicianId
            : (user?.physician_id || user?.id || '');

        const missingFields = validateRequiredFields();
        if (missingFields.length > 0) {
            toast.warning(
                `Please complete: ${missingFields.join(', ')}.`,
                'Required fields missing',
            );
            setLoading(false);
            return;
        }

        if (!user?.hospital_id || !referringPhysicianId) {
            toast.error('Referring clinician information is incomplete.');
            setLoading(false);
            return;
        }

        if (String(formData.receiving_hospital_id) === String(user.hospital_id)) {
            toast.warning('You cannot refer a patient to your own hospital.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                patient_id: parseInt(String(formData.patient_id)),
                referring_physician_id: parseInt(String(referringPhysicianId)),
                referring_hospital_id: parseInt(String(user.hospital_id)),
                receiving_hospital_id: parseInt(String(formData.receiving_hospital_id)),
                referral_reason: (formData.referral_reason || 'general') as ReferralReason,
                severity: formData.severity || 'medium',
                stability: formData.stability || 'stable',
                urgency_level: formData.urgency_level || 'routine',
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
                    hospital_id: user.hospital_id,
                    physician_id: referringPhysicianId,
                } : undefined,
            };

            const result = await referralsApi.create(payload);

            if (selectedFiles.length > 0 && result.referral_id) {
                setUploadProgress('Uploading attachments...');
                for (const file of selectedFiles) {
                    await referralsApi.uploadAttachment(result.referral_id, file).catch(() => undefined);
                }
                setUploadProgress('');
            }

            clearStoredAiReferralDraft();
            toast.success('Referral submitted successfully.');
            router.push(submitRedirectHref);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to submit referral.');
        } finally {
            setLoading(false);
        }
    };

    const getHospitalPreview = (hospital: Hospital) => {
        const generalBeds = hospitalResources.find(
            (resource) => (resource as { resource_type?: string }).resource_type === 'general_beds',
        ) as { available_count?: number; total_count?: number } | undefined;
        const icuBeds = hospitalResources.find(
            (resource) => (resource as { resource_type?: string }).resource_type === 'icu_beds',
        ) as { available_count?: number; total_count?: number } | undefined;

        return {
            generalBeds: generalBeds ? `${generalBeds.available_count}/${generalBeds.total_count}` : 'N/A',
            icuBeds: icuBeds ? `${icuBeds.available_count}/${icuBeds.total_count}` : 'N/A',
            level: (hospital.level || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
            ownership: hospital.ownership.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
        };
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
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href={backHref}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {mode === 'hospital_admin' ? 'Create Referral for Hospital Team' : 'Create New Referral'}
                    </h1>
                    <p className="text-gray-500">
                        Review, edit, and submit the structured referral through the existing routing workflow.
                    </p>
                </div>
            </div>

            <VoiceReferralCard
                autoOpen={autoOpenVoice}
                partialForm={formData as Record<string, unknown>}
                autoApplyOnReady
                onDraftReady={(draft) => {
                    applyDraftToForm(draft);
                    draftAppliedRef.current = true;
                }}
                className="mb-6"
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                {mode === 'hospital_admin' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Referring Clinician</CardTitle>
                            <CardDescription>Select the physician from your facility who is submitting this referral.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="referringPhysician">Physician</Label>
                                <Select value={selectedReferringPhysicianId} onValueChange={setSelectedReferringPhysicianId}>
                                    <SelectTrigger id="referringPhysician">
                                        <SelectValue placeholder="Select physician" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availablePhysicians.map((physician) => (
                                            <SelectItem key={physician.id} value={physician.id}>
                                                {(physician.title ? `${physician.title} ` : '') + (physician.full_name || physician.email || physician.id)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="rounded-lg border bg-gray-50 px-4 py-3 text-sm">
                                <p className="text-gray-500">Selected clinician</p>
                                <p className="font-medium text-gray-900">{selectedReferringPhysician?.full_name || 'Choose an active physician'}</p>
                                <p className="text-gray-500">{selectedReferringPhysician?.specialization || 'Specialization not recorded'}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Patient Details</CardTitle>
                        <CardDescription>Select a patient or enter details manually. Fields marked with <span className="text-red-500">*</span> are required when creating a new patient.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="patient" required>Select Patient</RequiredLabel>
                            <Select value={String(formData.patient_id || '')} onValueChange={handlePatientSelect}>
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

                        {formData.patient_id === '-1' && (
                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                Voice intake is populating a new patient draft. Review and edit the patient details below before submitting.
                            </div>
                        )}

                        <fieldset disabled={formData.patient_id !== '-1'} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="fullName" required>Full Name</RequiredLabel>
                                <Input id="fullName" value={formData.full_name} onChange={(event) => handleInputChange('full_name', event.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="dob" required>Date of Birth</RequiredLabel>
                                <Input id="dob" type="date" value={formData.date_of_birth} onChange={(event) => handleInputChange('date_of_birth', event.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="sex" required>Sex</RequiredLabel>
                                <Select value={formData.sex} onValueChange={(value) => handleInputChange('sex', value)}>
                                    <SelectTrigger id="sex">
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
                                <Input id="contact" value={formData.contact_number} onChange={(event) => handleInputChange('contact_number', event.target.value)} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <RequiredLabel htmlFor="address" required>Address</RequiredLabel>
                                <Input id="address" value={formData.address} onChange={(event) => handleInputChange('address', event.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nhisNumber">NHIS Number</Label>
                                <Input id="nhisNumber" value={formData.nhis_number} onChange={(event) => handleInputChange('nhis_number', event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nhisStatus">NHIS Status</Label>
                                <Select value={formData.nhis_status} onValueChange={(value) => handleInputChange('nhis_status', value)}>
                                    <SelectTrigger id="nhisStatus">
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

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Clinical Details</CardTitle>
                        <CardDescription>Provide clinical information for the referral. Required clinical fields are marked in red.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="complaint" required>Presenting Complaint</RequiredLabel>
                            <Textarea id="complaint" value={formData.presenting_complaint} onChange={(event) => handleInputChange('presenting_complaint', event.target.value)} rows={3} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="history">Clinical History</Label>
                            <Textarea id="history" value={formData.clinical_history} onChange={(event) => handleInputChange('clinical_history', event.target.value)} rows={3} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="examination">Examination Findings</Label>
                                <Textarea id="examination" value={formData.examination_findings} onChange={(event) => handleInputChange('examination_findings', event.target.value)} rows={3} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="investigations">Investigations</Label>
                                <Textarea id="investigations" value={formData.investigations_done} onChange={(event) => handleInputChange('investigations_done', event.target.value)} rows={3} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="diagnosis" required>Working Diagnosis</RequiredLabel>
                            <Input id="diagnosis" value={formData.working_diagnosis} onChange={(event) => handleInputChange('working_diagnosis', event.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="treatment">Treatment Given</Label>
                            <Textarea id="treatment" value={formData.treatment_given} onChange={(event) => handleInputChange('treatment_given', event.target.value)} rows={3} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Vital Signs & Location</CardTitle>
                        <CardDescription>Record patient vitals and supporting details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="temp">Temp (°C)</Label>
                                <Input id="temp" type="number" step="0.1" value={formData.vital_signs?.temperature ?? ''} onChange={(event) => handleVitalChange('temperature', event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pulse">Pulse</Label>
                                <Input id="pulse" type="number" value={formData.vital_signs?.pulse ?? ''} onChange={(event) => handleVitalChange('pulse', event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="resp">Resp Rate</Label>
                                <Input id="resp" type="number" value={formData.vital_signs?.respiratory_rate ?? ''} onChange={(event) => handleVitalChange('respiratory_rate', event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="spo2">SpO2</Label>
                                <Input id="spo2" type="number" value={formData.vital_signs?.spO2 ?? ''} onChange={(event) => handleVitalChange('spO2', event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bps">BP Sys</Label>
                                <Input id="bps" type="number" value={formData.vital_signs?.blood_pressure_systolic ?? ''} onChange={(event) => handleVitalChange('blood_pressure_systolic', event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bpd">BP Dia</Label>
                                <Input id="bpd" type="number" value={formData.vital_signs?.blood_pressure_diastolic ?? ''} onChange={(event) => handleVitalChange('blood_pressure_diastolic', event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gcs">GCS</Label>
                                <Input id="gcs" type="number" min="3" max="15" value={formData.vital_signs?.gcs ?? ''} onChange={(event) => handleVitalChange('gcs', event.target.value)} />
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="allergies">Known Allergies</Label>
                                <Input id="allergies" value={formData.known_allergies || ''} onChange={(event) => handleInputChange('known_allergies', event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="conditions">Pre-existing Conditions</Label>
                                <Input id="conditions" value={formData.pre_existing_conditions || ''} onChange={(event) => handleInputChange('pre_existing_conditions', event.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Referral Details</CardTitle>
                        <CardDescription>These values drive hospital recommendation and prioritization. Use the status badges to quickly confirm urgency, severity, and stability before submitting.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className={URGENCY_BADGE_STYLES[formData.urgency_level || 'routine'] || URGENCY_BADGE_STYLES.routine}>
                                Urgency: {(formData.urgency_level || 'routine').replace(/^./, (value) => value.toUpperCase())}
                            </Badge>
                            <Badge variant="outline" className={SEVERITY_BADGE_STYLES[formData.severity || 'medium'] || SEVERITY_BADGE_STYLES.medium}>
                                Severity: {(formData.severity || 'medium').replace(/^./, (value) => value.toUpperCase())}
                            </Badge>
                            <Badge variant="outline" className={STABILITY_BADGE_STYLES[formData.stability || 'stable'] || STABILITY_BADGE_STYLES.stable}>
                                Stability: {(formData.stability || 'stable').replace(/^./, (value) => value.toUpperCase())}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="reasonReferral" required>Reason for Referral</RequiredLabel>
                            <Textarea id="reasonReferral" value={formData.reason_for_referral} onChange={(event) => handleInputChange('reason_for_referral', event.target.value)} rows={3} required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="referralReason" required>Referral Reason</RequiredLabel>
                                <Select value={formData.referral_reason} onValueChange={(value) => handleInputChange('referral_reason', value)}>
                                    <SelectTrigger id="referralReason">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(Object.entries(EMERGENCY_TYPE_LABELS) as [ReferralReason, string][]).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="urgency" required>Urgency</RequiredLabel>
                                <Select value={formData.urgency_level} onValueChange={(value) => handleInputChange('urgency_level', value)}>
                                    <SelectTrigger
                                        id="urgency"
                                        className={URGENCY_TRIGGER_STYLES[formData.urgency_level || 'routine'] || URGENCY_TRIGGER_STYLES.routine}
                                    >
                                        <SelectValue>
                                            <StatusSelectValue
                                                value={formData.urgency_level || 'routine'}
                                                label={(formData.urgency_level || 'routine').replace(/^./, (entry) => entry.toUpperCase())}
                                            />
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="routine" className="text-green-800">
                                            <StatusSelectValue value="routine" label="Routine" />
                                        </SelectItem>
                                        <SelectItem value="urgent" className="text-amber-800">
                                            <StatusSelectValue value="urgent" label="Urgent" />
                                        </SelectItem>
                                        <SelectItem value="emergency" className="text-red-800">
                                            <StatusSelectValue value="emergency" label="Emergency" />
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="severity" required>Severity</RequiredLabel>
                                <Select value={formData.severity} onValueChange={(value) => handleInputChange('severity', value)}>
                                    <SelectTrigger
                                        id="severity"
                                        className={SEVERITY_TRIGGER_STYLES[formData.severity || 'medium'] || SEVERITY_TRIGGER_STYLES.medium}
                                    >
                                        <SelectValue>
                                            <StatusSelectValue
                                                value={formData.severity || 'medium'}
                                                label={(formData.severity || 'medium').replace(/^./, (entry) => entry.toUpperCase())}
                                            />
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="critical" className="text-red-800">
                                            <StatusSelectValue value="critical" label="Critical" />
                                        </SelectItem>
                                        <SelectItem value="high" className="text-orange-800">
                                            <StatusSelectValue value="high" label="High" />
                                        </SelectItem>
                                        <SelectItem value="medium" className="text-amber-800">
                                            <StatusSelectValue value="medium" label="Medium" />
                                        </SelectItem>
                                        <SelectItem value="low" className="text-green-800">
                                            <StatusSelectValue value="low" label="Low" />
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="stability" required>Stability</RequiredLabel>
                                <Select value={formData.stability} onValueChange={(value) => handleInputChange('stability', value)}>
                                    <SelectTrigger
                                        id="stability"
                                        className={STABILITY_TRIGGER_STYLES[formData.stability || 'stable'] || STABILITY_TRIGGER_STYLES.stable}
                                    >
                                        <SelectValue>
                                            <StatusSelectValue
                                                value={formData.stability || 'stable'}
                                                label={(formData.stability || 'stable').replace(/^./, (entry) => entry.toUpperCase())}
                                            />
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="stable" className="text-green-800">
                                            <StatusSelectValue value="stable" label="Stable" />
                                        </SelectItem>
                                        <SelectItem value="unstable" className="text-red-800">
                                            <StatusSelectValue value="unstable" label="Unstable" />
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="datetime" required>Date & Time</RequiredLabel>
                                <Input id="datetime" type="datetime-local" value={formData.referral_datetime} onChange={(event) => handleInputChange('referral_datetime', event.target.value)} required />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Referring Facility & Clinician</CardTitle>
                        <CardDescription>Auto-populated from the active profile and selected physician context.</CardDescription>
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
                                <p className="font-medium">
                                    {mode === 'hospital_admin' ? selectedReferringPhysician?.full_name || 'Choose a physician' : user?.full_name || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Receiving Hospital</CardTitle>
                        <CardDescription>Search directly or use the recommendation engine.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {engineError && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p>{engineError}</p>
                            </div>
                        )}

                        {(chosenHospital || selectedRecommendation) ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="font-semibold text-green-800">{chosenHospital?.name || selectedRecommendation?.hospital_name}</p>
                                                {chosenHospital && <p className="text-sm text-green-600">{chosenHospital.address}</p>}
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" onClick={handleClearHospital}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {chosenHospital && (
                                        <div className="mt-3 pt-3 border-t border-green-200">
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
                                                            <Badge className={`text-xs ${getLevelBadgeStyle(chosenHospital.level)}`} variant="outline">
                                                                {preview.level}
                                                            </Badge>
                                                        </div>
                                                        <div className="bg-white rounded-md p-2 text-center">
                                                            <Users className="h-4 w-4 text-sky-500 mx-auto mb-1" />
                                                            <p className="text-xs text-gray-500">Ownership</p>
                                                            <p className="font-semibold text-sm">{preview.ownership}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <Button type="button" variant="outline" onClick={handleGetRecommendations} className="w-full">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    View Algorithm Recommendations
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative" ref={dropdownRef}>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search hospitals by name or location..."
                                            value={hospitalSearch}
                                            onChange={(event) => {
                                                setHospitalSearch(event.target.value);
                                                setShowHospitalDropdown(true);
                                            }}
                                            onFocus={() => setShowHospitalDropdown(true)}
                                            className="pl-9"
                                        />
                                    </div>
                                    {showHospitalDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                            {filteredHospitals.length === 0 ? (
                                                <div className="p-3 text-sm text-gray-500 text-center">No hospitals found</div>
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
                                                                <Badge className={`text-xs ${getLevelBadgeStyle(hospital.level)}`} variant="outline">
                                                                    {preview.level}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                                                <span>Beds: {preview.generalBeds}</span>
                                                                <span>ICU: {preview.icuBeds}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Button type="button" variant="outline" onClick={handleGetRecommendations} className="w-full">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Get Algorithm Recommendations
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Attachments</CardTitle>
                        <CardDescription>Attach supporting documents. PDF, JPG, PNG, and WebP are supported.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            onDragOver={(event) => {
                                event.preventDefault();
                                event.currentTarget.classList.add('border-blue-400', 'bg-[#C4D8E5]/30');
                            }}
                            onDragLeave={(event) => {
                                event.currentTarget.classList.remove('border-blue-400', 'bg-[#C4D8E5]/30');
                            }}
                            onDrop={(event) => {
                                event.preventDefault();
                                event.currentTarget.classList.remove('border-blue-400', 'bg-[#C4D8E5]/30');
                                const files = Array.from(event.dataTransfer.files).filter((file) => file.size <= 10 * 1024 * 1024);
                                setSelectedFiles((prev) => [...prev, ...files]);
                            }}
                        >
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Click to browse or drag files here</p>
                            <p className="text-xs text-gray-400 mt-1">Max 10MB per file</p>
                        </div>
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="hidden"
                            onChange={(event) => {
                                const files = Array.from(event.target.files || []).filter((file) => file.size <= 10 * 1024 * 1024);
                                setSelectedFiles((prev) => [...prev, ...files]);
                                event.target.value = '';
                            }}
                        />
                        {selectedFiles.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {selectedFiles.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm">
                                        <div className="flex items-center gap-2">
                                            <Paperclip className="h-4 w-4 text-gray-400" />
                                            <span>{file.name}</span>
                                        </div>
                                        <button type="button" onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index))} className="text-red-500 hover:text-red-700">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {uploadProgress && <p className="text-sm text-primary mt-2">{uploadProgress}</p>}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Link href={backHref}>
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={loading || (!chosenHospital && !selectedRecommendation)}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : 'Create Referral'}
                    </Button>
                </div>
            </form>

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

export function ReferralFormScreen(props: ReferralFormScreenProps) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ReferralFormScreenContent {...props} />
        </Suspense>
    );
}
