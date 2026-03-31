'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Loader2, ArrowLeft, Stethoscope, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import { hospitalsApi } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Hospital {
    id: string;
    name: string;
    level: string;
    address: string;
}

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get('invite');

    // Admin invite state
    const [isAdminInvite, setIsAdminInvite] = useState(false);
    const [inviteHospitalName, setInviteHospitalName] = useState('');
    const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
    const [inviteError, setInviteError] = useState('');

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [hospitalId, setHospitalId] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [title, setTitle] = useState('Dr');
    const [specialization, setSpecialization] = useState('');
    const [department, setDepartment] = useState('');
    const [grade, setGrade] = useState('');

    // UI state
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [hospitalSearch, setHospitalSearch] = useState('');
    const [step, setStep] = useState(1);

    // Inline validation state
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [nameError, setNameError] = useState('');
    const [specializationsList, setSpecializationsList] = useState<string[]>([]);

    // Load hospitals & validate invite token
    useEffect(() => {
        hospitalsApi.list()
            .then((data) => setHospitals(data as unknown as Hospital[]))
            .catch(() => console.warn('Could not load hospitals'));

        fetch(`${API_BASE}/api/options/specializations`)
            .then((res) => res.json())
            .then((data) => setSpecializationsList(data))
            .catch(() => console.warn('Could not load specializations'));

        if (inviteToken) {
            setInviteLoading(true);
            fetch(`${API_BASE}/api/super-admin/invites/${inviteToken}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setIsAdminInvite(true);
                        setEmail(data.email);
                        setHospitalId(data.hospital_id.toString());
                        // Look up hospital name for display
                        hospitalsApi.list().then((hospitals) => {
                            const h = (hospitals as unknown as Hospital[]).find(
                                h => h.id === data.hospital_id.toString()
                            );
                            if (h) setInviteHospitalName(h.name);
                        });
                    } else {
                        setInviteError('This invite link is invalid or has expired. Please contact your system administrator for a new link.');
                    }
                })
                .catch(() => setInviteError('Could not validate invite link. Please check your connection and try again.'))
                .finally(() => setInviteLoading(false));
        }
    }, [inviteToken]);

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(hospitalSearch.toLowerCase())
    );

    const validateAccountFields = (): boolean => {
        setEmailError('');
        setPasswordError('');
        setNameError('');
        let hasError = false;

        if (!firstName.trim() || !lastName.trim()) {
            setNameError('First name and last name are required');
            hasError = true;
        }

        if (!isAdminInvite && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError('Please enter a valid email format');
            hasError = true;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(password)) {
            setPasswordError('Password must be at least 8 chars, with uppercase, lowercase, number, and special character.');
            hasError = true;
        } else if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            hasError = true;
        }

        return !hasError;
    };

    const handleNextStep = () => {
        if (validateAccountFields()) {
            setStep(2);
        }
    };

    const handleAdminSubmit = async () => {
        if (!validateAccountFields()) return;
        // Trigger the shared submit logic
        await doSubmit();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdminInvite && !hospitalId) {
            setError('Please select your hospital');
            return;
        }
        await doSubmit();
    };

    const doSubmit = async () => {
        setError('');
        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            const authUid = authData.user?.id;
            if (!authUid) {
                setError('Failed to create account. Please try again.');
                setLoading(false);
                return;
            }

            const url = isAdminInvite ? `${API_BASE}/api/auth/register-admin` : `${API_BASE}/api/auth/register`;
            const payload = isAdminInvite
                ? {
                    auth_uid: authUid,
                    token: inviteToken,
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phoneNumber,
                }
                : {
                    auth_uid: authUid,
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    phone_number: phoneNumber,
                    hospital_id: parseInt(hospitalId),
                    license_number: licenseNumber,
                    title,
                    specialization,
                    department,
                    grade,
                };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.success) {
                if (!isAdminInvite) {
                    await supabase.auth.signOut();
                }
                setSuccess(true);
            } else {
                setError(data.detail || 'Registration failed. Please try again.');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ---- Loading state while validating invite token ----
    if (inviteLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-slate-500">Validating your invite link...</p>
                </div>
            </div>
        );
    }

    // ---- Invalid/expired invite ----
    if (inviteToken && inviteError) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Card className="w-full max-w-md shadow-xl shadow-slate-200/60 border-red-100 text-center">
                    <CardContent className="pt-10 pb-8">
                        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-200/50">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Invite Link</h2>
                        <p className="text-slate-500 leading-relaxed mb-8">{inviteError}</p>
                        <Link href="/login">
                            <Button variant="outline" className="rounded-xl px-8">
                                Go to Login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ---- Success screen ----
    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Card className="w-full max-w-md shadow-xl shadow-slate-200/60 border-slate-100 text-center">
                    <CardContent className="pt-10 pb-8">
                        <div className={`mx-auto mb-6 h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg ${isAdminInvite ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-200/50' : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-200/50'}`}>
                            <CheckCircle2 className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            {isAdminInvite ? 'Admin Account Created!' : 'Registration Submitted!'}
                        </h2>
                        <p className="text-slate-500 leading-relaxed mb-8">
                            {isAdminInvite
                                ? `Your Hospital Admin account for ${inviteHospitalName || 'your facility'} has been activated. You can now log in to manage your hospital.`
                                : "Your account is pending approval by your hospital administrator. You'll receive an email notification once approved."}
                        </p>
                        <Link href="/login">
                            <Button className={`rounded-xl px-8 shadow-md font-semibold ${isAdminInvite ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-200/50' : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-blue-200/50'}`}>
                                Go to Login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ================================================================
    // ADMIN INVITE REGISTRATION (visually distinct)
    // ================================================================
    if (isAdminInvite) {
        return (
            <div className="min-h-screen flex">
                {/* Left panel — purple admin branding */}
                <div className="hidden lg:flex lg:w-2/5 relative bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 items-center justify-center p-12">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                    <div className="relative z-10 max-w-sm text-center">
                        <div className="mx-auto mb-8 h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-lg flex items-center justify-center border border-white/30">
                            <ShieldCheck className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                            Hospital Administrator
                        </h1>
                        <p className="mt-4 text-purple-200 text-lg leading-relaxed">
                            You have been invited to manage a facility on the Hospital Routing System.
                        </p>
                        <div className="mt-10 space-y-4 text-left">
                            {[
                                'Approve and manage physician accounts',
                                'Monitor hospital resources and capacity',
                                'Oversee incoming patient referrals',
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                                    <CheckCircle2 className="h-5 w-5 text-purple-300 flex-shrink-0" />
                                    <span className="text-sm text-white">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right panel — admin form */}
                <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
                    <div className="w-full max-w-lg">
                        <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-purple-600 transition-colors mb-6 group">
                            <ArrowLeft className="h-4 w-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                            Back to home
                        </Link>

                        <Card className="shadow-xl shadow-purple-100/40 border-purple-100">
                            <CardHeader className="pb-2">
                                <div className="lg:hidden mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-200">
                                    <ShieldCheck className="h-6 w-6 text-white" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-center lg:text-left">Hospital Admin Setup</CardTitle>
                                <CardDescription className="text-center lg:text-left">Complete your administrator account</CardDescription>
                            </CardHeader>

                            <CardContent className="pt-4">
                                {/* Assigned hospital badge */}
                                <div className="mb-5 flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-3">
                                    <Building2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-purple-500 font-medium">Assigned Facility</p>
                                        <p className="text-sm font-semibold text-purple-900">{inviteHospitalName || 'Loading...'}</p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name *</Label>
                                            <Input id="firstName" placeholder="Kwame" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name *</Label>
                                            <Input id="lastName" placeholder="Mensah" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11" />
                                        </div>
                                    </div>
                                    {nameError && <p className="text-xs text-red-500">{nameError}</p>}

                                    <div className="space-y-2">
                                        <Label htmlFor="regEmail">Email Address</Label>
                                        <Input id="regEmail" type="email" value={email} disabled className="h-11 bg-slate-100 text-slate-500" />
                                        <p className="text-xs text-slate-400">Set by your invitation — cannot be changed</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" placeholder="+233 24 123 4567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="h-11" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="regPassword">Password *</Label>
                                            <Input id="regPassword" type="password" placeholder="Min 8 characters" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }} className={`h-11 ${passwordError ? 'border-red-500' : ''}`} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm">Confirm Password *</Label>
                                            <Input id="confirm" type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }} className={`h-11 ${passwordError ? 'border-red-500' : ''}`} />
                                        </div>
                                    </div>
                                    {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}

                                    <Button
                                        type="button"
                                        onClick={handleAdminSubmit}
                                        disabled={loading}
                                        className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-200/50 font-semibold mt-2"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                        {loading ? 'Creating Account...' : 'Create Admin Account'}
                                    </Button>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                                    <p className="text-sm text-slate-500">
                                        Already have an account?{' '}
                                        <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">Sign in</Link>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // ================================================================
    // DOCTOR REGISTRATION (original blue theme)
    // ================================================================
    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-2/5 relative bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 items-center justify-center p-12">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="relative z-10 max-w-sm text-center">
                    <div className="mx-auto mb-8 h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-lg flex items-center justify-center border border-white/30">
                        <Stethoscope className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                        Join the HRS Network
                    </h1>
                    <p className="mt-4 text-blue-100 text-lg leading-relaxed">
                        Register as a physician to start making patient referrals across the
                        Greater Accra healthcare network.
                    </p>
                    <div className="mt-10 space-y-4 text-left">
                        {[
                            'Select from 170+ pre-loaded facilities',
                            'Get verified by your hospital admin',
                            'Start referring patients instantly',
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                                <CheckCircle2 className="h-5 w-5 text-cyan-300 flex-shrink-0" />
                                <span className="text-sm text-white">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-start justify-center p-6 pt-8 bg-slate-50 overflow-y-auto">
                <div className="w-full max-w-lg">
                    <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 group">
                        <ArrowLeft className="h-4 w-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                        Back to home
                    </Link>

                    <Card className="shadow-xl shadow-slate-200/60 border-slate-100">
                        <CardHeader className="pb-2">
                            <div className="lg:hidden mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-200">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-center lg:text-left">Doctor Registration</CardTitle>
                            <CardDescription className="text-center lg:text-left">Create your HRS account to start referring patients</CardDescription>
                        </CardHeader>

                        <CardContent className="pt-4">
                            {/* Step indicator */}
                            <div className="flex items-center gap-2 mb-6">
                                <button
                                    onClick={() => setStep(1)}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    1. Account Details
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    2. Professional Info
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {step === 1 && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name *</Label>
                                                <Input id="firstName" placeholder="Kwame" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name *</Label>
                                                <Input id="lastName" placeholder="Mensah" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="h-11" />
                                            </div>
                                        </div>
                                        {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                                        <div className="space-y-2">
                                            <Label htmlFor="regEmail">Email Address *</Label>
                                            <Input id="regEmail" type="email" placeholder="kwame.mensah@hospital.gov.gh" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }} required className={`h-11 ${emailError ? 'border-red-500' : ''}`} />
                                            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input id="phone" placeholder="+233 24 123 4567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="h-11" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="regPassword">Password *</Label>
                                                <Input id="regPassword" type="password" placeholder="Min 8 characters, complex" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }} required className={`h-11 ${passwordError ? 'border-red-500' : ''}`} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirm">Confirm Password *</Label>
                                                <Input id="confirm" type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }} required className={`h-11 ${passwordError ? 'border-red-500' : ''}`} />
                                            </div>
                                        </div>
                                        {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                                        <Button
                                            type="button"
                                            onClick={handleNextStep}
                                            className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-200/50 font-semibold mt-2"
                                        >
                                            Continue to Professional Info
                                        </Button>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        {/* Hospital selection with search */}
                                        <div className="space-y-2">
                                            <Label>Select Your Hospital *</Label>
                                            <Input
                                                placeholder="Search hospitals..."
                                                value={hospitalSearch}
                                                onChange={(e) => setHospitalSearch(e.target.value)}
                                                className="h-11"
                                            />
                                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white">
                                                {filteredHospitals.length === 0 ? (
                                                    <div className="p-3 text-sm text-slate-400 text-center">No hospitals found</div>
                                                ) : (
                                                    filteredHospitals.slice(0, 30).map((h) => (
                                                        <button
                                                            key={h.id}
                                                            type="button"
                                                            onClick={() => { setHospitalId(h.id); setHospitalSearch(h.name); }}
                                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 ${hospitalId === h.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                                                        >
                                                            <div className="font-medium">{h.name}</div>
                                                            <div className="text-xs text-slate-400">{h.level} {h.address}</div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Title</Label>
                                                <select id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white">
                                                    <option value="Dr">Dr</option>
                                                    <option value="Prof">Prof</option>
                                                    <option value="Mr">Mr</option>
                                                    <option value="Mrs">Mrs</option>
                                                    <option value="Ms">Ms</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="license">License Number *</Label>
                                                <Input id="license" placeholder="MC-GH-12345" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required className="h-11" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="spec">Specialization *</Label>
                                            <select id="spec" value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" required>
                                                <option value="" disabled>Select Specialization</option>
                                                {specializationsList.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="dept">Department</Label>
                                                <select id="dept" value={department} onChange={(e) => setDepartment(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white">
                                                    <option value="" disabled>Select Department</option>
                                                    <option value="Emergency (A&E)">Emergency (A&E)</option>
                                                    <option value="Internal Medicine">Internal Medicine</option>
                                                    <option value="Surgery">Surgery</option>
                                                    <option value="Pediatrics">Pediatrics</option>
                                                    <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                                                    <option value="Cardiology">Cardiology</option>
                                                    <option value="Neurology">Neurology</option>
                                                    <option value="Orthopedics">Orthopedics</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="grade">Clinical Rank</Label>
                                                <select id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white">
                                                    <option value="" disabled>Select Rank</option>
                                                    <option value="House Officer">House Officer</option>
                                                    <option value="Medical Officer">Medical Officer</option>
                                                    <option value="Senior Medical Officer">Senior Medical Officer</option>
                                                    <option value="Specialist">Specialist</option>
                                                    <option value="Consultant">Consultant</option>
                                                    <option value="Senior Consultant">Senior Consultant</option>
                                                </select>
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="text-sm text-center p-3 rounded-xl bg-red-50 text-red-600 border border-red-100">
                                                {error}
                                            </div>
                                        )}

                                        <div className="flex gap-3 mt-2">
                                            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl">
                                                Back
                                            </Button>
                                            <Button type="submit" className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-200/50 font-semibold" disabled={loading}>
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Registering...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Stethoscope className="h-4 w-4 mr-2" />
                                                        Register
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </form>

                            {/* Login link */}
                            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                                <p className="text-sm text-slate-500">
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
            <RegisterForm />
        </Suspense>
    );
}
