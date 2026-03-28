'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/api-client';

interface LoginResult {
    success: boolean;
    status?: 'active' | 'pending' | 'rejected';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<LoginResult>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // On mount: check for existing Supabase session and load profile
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    // Session exists — fetch profile from backend
                    const profileData = await authApi.me();
                    if (profileData.user) {
                        const appUser = profileData.user as unknown as User;
                        setUser(appUser);
                        localStorage.setItem('currentUser', JSON.stringify(appUser));
                    }
                } else {
                    // No Supabase session — try localStorage fallback
                    const cached = localStorage.getItem('currentUser');
                    if (cached) {
                        // Don't trust the cache — clear it since there's no valid session
                        localStorage.removeItem('currentUser');
                    }
                }
            } catch {
                // Backend unreachable
                const cached = localStorage.getItem('currentUser');
                if (cached) {
                    setUser(JSON.parse(cached));
                }
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth state changes (token refresh, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    localStorage.removeItem('currentUser');
                } else if (event === 'TOKEN_REFRESHED' && session) {
                    // Token refreshed — profile is still valid, no action needed
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<LoginResult> => {
        try {
            // Try Supabase sign-in first
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                // Supabase login failed — try legacy migration endpoint
                try {
                    const legacyResult = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password }),
                        }
                    ).then(r => r.json());

                    if (legacyResult.success && legacyResult.migrated && legacyResult.auth_uid) {
                        // User was migrated — now sign in via Supabase
                        const { error: retryError } = await supabase.auth.signInWithPassword({ email, password });
                        if (retryError) {
                            return { success: false };
                        }
                    } else if (legacyResult.success === false) {
                        return { success: false, status: legacyResult.status };
                    } else {
                        return { success: false };
                    }
                } catch {
                    return { success: false };
                }
            }

            // Supabase login succeeded — fetch app profile from backend
            const profileData = await authApi.me();

            if (!profileData.user) {
                // No public.users record — user exists in Supabase but not in app
                await supabase.auth.signOut();
                return { success: false };
            }

            const appUser = profileData.user as unknown as User;

            if (appUser.status === 'pending') {
                await supabase.auth.signOut();
                return { success: false, status: 'pending' };
            }

            if (appUser.status === 'rejected') {
                await supabase.auth.signOut();
                return { success: false, status: 'rejected' };
            }

            setUser(appUser);
            localStorage.setItem('currentUser', JSON.stringify(appUser));
            return { success: true, status: 'active' };
        } catch {
            return { success: false };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch {
            // ignore
        }
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    const refreshUser = async () => {
        try {
            const profileData = await authApi.me();
            if (profileData.user) {
                const appUser = profileData.user as unknown as User;
                setUser(appUser);
                localStorage.setItem('currentUser', JSON.stringify(appUser));
            }
        } catch {
            // ignore
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
