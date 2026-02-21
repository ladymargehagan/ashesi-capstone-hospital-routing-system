'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Redirect based on role
        if (email === 'admin@healthref.com') {
          router.push('/admin');
        } else if (email === 'hospital@general.com') {
          router.push('/hospital');
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Healthcare Referral System</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              />
            </div>

            {error && (
              <div className={`text-sm text-center p-3 rounded-lg ${error.includes('under review')
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : error.includes('rejected')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'text-red-600'
                }`}>
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
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

          {/* Register Hospital Link */}
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-gray-500 mb-3">Want to onboard your hospital?</p>
            <Link href="/register">
              <Button variant="outline" className="w-full">
                <Building2 className="h-4 w-4 mr-2" />
                Register Hospital
              </Button>
            </Link>
          </div>

          {/* Demo credentials hint - for development */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 text-center mb-3">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><span className="font-medium">Admin:</span> admin@healthref.com / admin123</p>
              <p><span className="font-medium">Hospital:</span> hospital@general.com / hospital123</p>
              <p><span className="font-medium">Physician:</span> physician@clinic.com / physician123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
