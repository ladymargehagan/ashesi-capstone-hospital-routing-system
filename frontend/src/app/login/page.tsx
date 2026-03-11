'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/toast-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Loader2, ArrowLeft, Stethoscope } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);

            if (result.success) {
                toast.success('Welcome back! Redirecting to your dashboard...', 'Signed In');
                // Redirect based on role — use the stored user object
                const cached = localStorage.getItem('currentUser');
                if (cached) {
                    const user = JSON.parse(cached);
                    if (user.role === 'super_admin') {
                        router.push('/admin');
                    } else if (user.role === 'hospital_admin') {
                        router.push('/hospital');
                    } else {
                        router.push('/physician');
                    }
                } else {
                    router.push('/physician');
                }
            } else if (result.status === 'pending') {
                setError('Your application is currently under review. You will be notified once it has been approved.');
            } else if (result.status === 'rejected') {
                setError('Your application has been rejected. Please contact support for more information.');
            } else {
                setError('Invalid email or password');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 items-center justify-center p-12">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="relative z-10 max-w-md text-center">
                    <div className="mx-auto mb-8 h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-lg flex items-center justify-center border border-white/30">
                        <Activity className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
                        Hospital Routing System
                    </h1>
                    <p className="mt-4 text-blue-100 text-lg leading-relaxed">
                        Streamlining patient referrals across the Greater Accra Region.
                    </p>
                    <div className="mt-10 grid grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
                            <div className="text-2xl font-bold text-white">170+</div>
                            <div className="text-xs text-blue-200 mt-1">Facilities</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
                            <div className="text-2xl font-bold text-white">8</div>
                            <div className="text-xs text-blue-200 mt-1">Districts</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
                            <div className="text-2xl font-bold text-white">24/7</div>
                            <div className="text-xs text-blue-200 mt-1">Access</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-md">
                    <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors mb-8 group">
                        <ArrowLeft className="h-4 w-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                        Back to home
                    </Link>

                    <Card className="shadow-xl shadow-slate-200/60 border-slate-100">
                        <CardHeader className="pb-2">
                            <div className="lg:hidden mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-200">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-center lg:text-left">Welcome back</CardTitle>
                            <CardDescription className="text-center lg:text-left">Sign in to your HRS account</CardDescription>
                        </CardHeader>

                        <CardContent className="pt-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@hospital.gov.gh"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-11"
                                    />
                                </div>

                                {error && (
                                    <div className={`text-sm text-center p-3 rounded-xl ${error.includes('under review')
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : error.includes('rejected')
                                            ? 'bg-red-50 text-red-700 border border-red-200'
                                            : 'bg-red-50 text-red-600 border border-red-100'
                                        }`}>
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl shadow-md shadow-blue-200/50 font-semibold" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>
                            </form>

                            {/* Register link */}
                            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                                <p className="text-sm text-slate-500 mb-3">Are you a doctor? Join the network.</p>
                                <Link href="/register">
                                    <Button variant="outline" className="w-full rounded-xl border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                                        <Stethoscope className="h-4 w-4 mr-2" />
                                        Register as a Doctor
                                    </Button>
                                </Link>
                            </div>

                            {/* Demo credentials */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-xs text-slate-400 text-center mb-2">Demo Accounts:</p>
                                <div className="space-y-1 text-xs text-slate-500">
                                    <p><span className="font-medium text-slate-600">Admin:</span> admin@hrs.gov.gh / admin123</p>
                                    <p><span className="font-medium text-slate-600">Hospital:</span> admin@korlebu.gov.gh / hospital123</p>
                                    <p><span className="font-medium text-slate-600">Physician:</span> dr.mensah@korlebu.gov.gh / physician123</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
