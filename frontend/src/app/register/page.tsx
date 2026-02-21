'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Building2, User, ClipboardCheck, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { HospitalRegistrationData } from '@/types';
import { registerHospital } from '@/lib/mock-data';

const STEPS = [
    { id: 1, title: 'Hospital Details', icon: Building2 },
    { id: 2, title: 'Admin Account', icon: User },
    { id: 3, title: 'Review & Submit', icon: ClipboardCheck },
];

const initialFormData: HospitalRegistrationData = {
    hospital_name: '',
    license_number: '',
    address: '',
    tier: 'tier_1',
    type: 'polyclinic',
    ownership: 'public',
    operating_hours: '',
    contact_phone: '',
    gps_lat: '',
    gps_lng: '',
    admin_full_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    admin_password_confirm: '',
};

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<HospitalRegistrationData>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const updateField = (field: keyof HospitalRegistrationData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user edits
        if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validateStep1 = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.hospital_name.trim()) newErrors.hospital_name = 'Hospital name is required';
        if (!formData.license_number.trim()) newErrors.license_number = 'License number is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.gps_lat.trim()) newErrors.gps_lat = 'Latitude is required';
        if (!formData.gps_lng.trim()) newErrors.gps_lng = 'Longitude is required';
        if (formData.gps_lat && (isNaN(Number(formData.gps_lat)) || Number(formData.gps_lat) < -90 || Number(formData.gps_lat) > 90)) {
            newErrors.gps_lat = 'Latitude must be between -90 and 90';
        }
        if (formData.gps_lng && (isNaN(Number(formData.gps_lng)) || Number(formData.gps_lng) < -180 || Number(formData.gps_lng) > 180)) {
            newErrors.gps_lng = 'Longitude must be between -180 and 180';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.admin_full_name.trim()) newErrors.admin_full_name = 'Full name is required';
        if (!formData.admin_email.trim()) newErrors.admin_email = 'Email is required';
        if (formData.admin_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
            newErrors.admin_email = 'Enter a valid email address';
        }
        if (!formData.admin_password) newErrors.admin_password = 'Password is required';
        if (formData.admin_password && formData.admin_password.length < 8) {
            newErrors.admin_password = 'Password must be at least 8 characters';
        }
        if (!formData.admin_password_confirm) newErrors.admin_password_confirm = 'Please confirm your password';
        if (formData.admin_password && formData.admin_password_confirm && formData.admin_password !== formData.admin_password_confirm) {
            newErrors.admin_password_confirm = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        registerHospital({
            hospital_name: formData.hospital_name,
            license_number: formData.license_number,
            address: formData.address,
            tier: formData.tier,
            type: formData.type,
            ownership: formData.ownership,
            operating_hours: formData.operating_hours,
            contact_phone: formData.contact_phone,
            gps_lat: formData.gps_lat,
            gps_lng: formData.gps_lng,
            admin_full_name: formData.admin_full_name,
            admin_email: formData.admin_email,
            admin_phone: formData.admin_phone,
        });

        setLoading(false);
        setSubmitted(true);
    };

    const tierLabels: Record<string, string> = {
        tier_1: 'Tier 1 — Primary Care',
        tier_2: 'Tier 2 — Secondary Care',
        tier_3: 'Tier 3 — Tertiary Care',
    };

    const typeLabels: Record<string, string> = {
        polyclinic: 'Polyclinic',
        district: 'District Hospital',
        regional: 'Regional Hospital',
        teaching: 'Teaching Hospital',
        specialist: 'Specialist Hospital',
    };

    const ownershipLabels: Record<string, string> = {
        public: 'Government / Public',
        private: 'Private',
        faith_based: 'Faith-Based',
        military: 'Military',
    };

    // Success screen
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl text-center">
                    <CardContent className="pt-10 pb-8 space-y-6">
                        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
                            <p className="text-gray-500 leading-relaxed">
                                Your hospital registration for <span className="font-medium text-gray-700">{formData.hospital_name}</span> has been submitted successfully.
                            </p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-sm text-amber-800">
                                <span className="font-semibold">What happens next?</span><br />
                                A system administrator will review your application. You will be notified via email
                                at <span className="font-medium">{formData.admin_email}</span> once your application has been approved.
                            </p>
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => router.push('/')}
                        >
                            Return to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center">
                        <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Register Your Hospital</h1>
                    <p className="text-gray-500 mt-1">Join the Healthcare Referral System</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center">
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${step === s.id
                                        ? 'bg-blue-600 text-white'
                                        : step > s.id
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                {step > s.id ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <s.icon className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">{s.title}</span>
                                <span className="sm:hidden">{s.id}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`w-8 h-0.5 mx-1 ${step > s.id ? 'bg-green-300' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <Card className="shadow-xl">
                    {/* Step 1: Hospital Details */}
                    {step === 1 && (
                        <>
                            <CardHeader>
                                <CardTitle className="text-lg">Hospital Information</CardTitle>
                                <CardDescription>Provide details about your hospital facility</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Hospital Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="hospital_name">Hospital Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="hospital_name"
                                        placeholder="e.g. Accra General Hospital"
                                        value={formData.hospital_name}
                                        onChange={e => updateField('hospital_name', e.target.value)}
                                        className={errors.hospital_name ? 'border-red-300' : ''}
                                    />
                                    {errors.hospital_name && <p className="text-xs text-red-500">{errors.hospital_name}</p>}
                                </div>

                                {/* License Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="license_number">License Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="license_number"
                                        placeholder="e.g. GHS-LIC-2025-001"
                                        value={formData.license_number}
                                        onChange={e => updateField('license_number', e.target.value)}
                                        className={errors.license_number ? 'border-red-300' : ''}
                                    />
                                    {errors.license_number && <p className="text-xs text-red-500">{errors.license_number}</p>}
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="address"
                                        placeholder="e.g. 123 Independence Ave, Accra"
                                        value={formData.address}
                                        onChange={e => updateField('address', e.target.value)}
                                        className={errors.address ? 'border-red-300' : ''}
                                    />
                                    {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                                </div>

                                {/* Tier, Type, Ownership row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tier <span className="text-red-500">*</span></Label>
                                        <Select value={formData.tier} onValueChange={v => updateField('tier', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(tierLabels).map(([val, label]) => (
                                                    <SelectItem key={val} value={val}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type <span className="text-red-500">*</span></Label>
                                        <Select value={formData.type} onValueChange={v => updateField('type', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(typeLabels).map(([val, label]) => (
                                                    <SelectItem key={val} value={val}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ownership <span className="text-red-500">*</span></Label>
                                        <Select value={formData.ownership} onValueChange={v => updateField('ownership', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(ownershipLabels).map(([val, label]) => (
                                                    <SelectItem key={val} value={val}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Operating Hours & Contact Phone */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="operating_hours">Operating Hours</Label>
                                        <Input
                                            id="operating_hours"
                                            placeholder="e.g. 24/7 or Mon-Fri 8am-5pm"
                                            value={formData.operating_hours}
                                            onChange={e => updateField('operating_hours', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_phone">Contact Phone</Label>
                                        <Input
                                            id="contact_phone"
                                            placeholder="e.g. +233 24 555 1234"
                                            value={formData.contact_phone}
                                            onChange={e => updateField('contact_phone', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* GPS Coordinates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gps_lat">Latitude <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="gps_lat"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. 5.6037"
                                            value={formData.gps_lat}
                                            onChange={e => updateField('gps_lat', e.target.value)}
                                            className={errors.gps_lat ? 'border-red-300' : ''}
                                        />
                                        {errors.gps_lat && <p className="text-xs text-red-500">{errors.gps_lat}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gps_lng">Longitude <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="gps_lng"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. -0.1870"
                                            value={formData.gps_lng}
                                            onChange={e => updateField('gps_lng', e.target.value)}
                                            className={errors.gps_lng ? 'border-red-300' : ''}
                                        />
                                        {errors.gps_lng && <p className="text-xs text-red-500">{errors.gps_lng}</p>}
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Link href="/">
                                        <Button variant="ghost" type="button">
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back to Login
                                        </Button>
                                    </Link>
                                    <Button onClick={handleNext}>
                                        Continue
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 2: Admin Account */}
                    {step === 2 && (
                        <>
                            <CardHeader>
                                <CardTitle className="text-lg">Administrator Account</CardTitle>
                                <CardDescription>Create the admin account that will manage this hospital</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="admin_full_name">Full Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="admin_full_name"
                                        placeholder="e.g. John Doe"
                                        value={formData.admin_full_name}
                                        onChange={e => updateField('admin_full_name', e.target.value)}
                                        className={errors.admin_full_name ? 'border-red-300' : ''}
                                    />
                                    {errors.admin_full_name && <p className="text-xs text-red-500">{errors.admin_full_name}</p>}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="admin_email">Email Address <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="admin_email"
                                        type="email"
                                        placeholder="e.g. admin@hospital.com"
                                        value={formData.admin_email}
                                        onChange={e => updateField('admin_email', e.target.value)}
                                        className={errors.admin_email ? 'border-red-300' : ''}
                                    />
                                    {errors.admin_email && <p className="text-xs text-red-500">{errors.admin_email}</p>}
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <Label htmlFor="admin_phone">Phone Number</Label>
                                    <Input
                                        id="admin_phone"
                                        placeholder="e.g. +233 24 555 1234"
                                        value={formData.admin_phone}
                                        onChange={e => updateField('admin_phone', e.target.value)}
                                    />
                                </div>

                                <Separator />

                                {/* Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="admin_password">Password <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="admin_password"
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        value={formData.admin_password}
                                        onChange={e => updateField('admin_password', e.target.value)}
                                        className={errors.admin_password ? 'border-red-300' : ''}
                                    />
                                    {errors.admin_password && <p className="text-xs text-red-500">{errors.admin_password}</p>}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="admin_password_confirm">Confirm Password <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="admin_password_confirm"
                                        type="password"
                                        placeholder="Re-enter your password"
                                        value={formData.admin_password_confirm}
                                        onChange={e => updateField('admin_password_confirm', e.target.value)}
                                        className={errors.admin_password_confirm ? 'border-red-300' : ''}
                                    />
                                    {errors.admin_password_confirm && <p className="text-xs text-red-500">{errors.admin_password_confirm}</p>}
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button variant="outline" onClick={handleBack}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back
                                    </Button>
                                    <Button onClick={handleNext}>
                                        Review Application
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 3: Review & Submit */}
                    {step === 3 && (
                        <>
                            <CardHeader>
                                <CardTitle className="text-lg">Review Your Application</CardTitle>
                                <CardDescription>Please verify all information before submitting</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Hospital Details Summary */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-base text-gray-900">Hospital Details</h3>
                                        <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                                            Edit
                                        </Button>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                                        <div className="grid grid-cols-2 gap-y-3">
                                            <div>
                                                <p className="text-gray-500">Hospital Name</p>
                                                <p className="font-medium">{formData.hospital_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">License Number</p>
                                                <p className="font-medium">{formData.license_number}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-500">Address</p>
                                                <p className="font-medium">{formData.address}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Tier</p>
                                                <Badge variant="outline" className="mt-1">{tierLabels[formData.tier]}</Badge>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Type</p>
                                                <Badge variant="outline" className="mt-1">{typeLabels[formData.type]}</Badge>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Ownership</p>
                                                <Badge variant="outline" className="mt-1">{ownershipLabels[formData.ownership]}</Badge>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">GPS Coordinates</p>
                                                <p className="font-medium">{formData.gps_lat}, {formData.gps_lng}</p>
                                            </div>
                                            {formData.operating_hours && (
                                                <div>
                                                    <p className="text-gray-500">Operating Hours</p>
                                                    <p className="font-medium">{formData.operating_hours}</p>
                                                </div>
                                            )}
                                            {formData.contact_phone && (
                                                <div>
                                                    <p className="text-gray-500">Contact Phone</p>
                                                    <p className="font-medium">{formData.contact_phone}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Admin Account Summary */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-base text-gray-900">Administrator Account</h3>
                                        <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                                            Edit
                                        </Button>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                                        <div className="grid grid-cols-2 gap-y-3">
                                            <div>
                                                <p className="text-gray-500">Full Name</p>
                                                <p className="font-medium">{formData.admin_full_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Email</p>
                                                <p className="font-medium">{formData.admin_email}</p>
                                            </div>
                                            {formData.admin_phone && (
                                                <div>
                                                    <p className="text-gray-500">Phone</p>
                                                    <p className="font-medium">{formData.admin_phone}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-gray-500">Password</p>
                                                <p className="font-medium">{'•'.repeat(formData.admin_password.length)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                                    By submitting, your hospital application will be sent for review by a system administrator.
                                    You will be notified once your application has been processed.
                                </div>

                                <div className="flex justify-between pt-2">
                                    <Button variant="outline" onClick={handleBack}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Submit Application
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>

                {/* Footer link */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Already registered?{' '}
                    <Link href="/" className="text-blue-600 hover:underline font-medium">
                        Sign in here
                    </Link>
                </p>
            </div>
        </div>
    );
}
