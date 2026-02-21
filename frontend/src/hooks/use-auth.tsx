'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@/types';
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

    useEffect(() => {
        // Check for existing session via the backend /api/auth/me endpoint
        authApi.me()
            .then((data) => {
                if (data.user) {
                    setUser(data.user as unknown as User);
                    // Also store in localStorage as a cache
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                } else {
                    // Try localStorage fallback for SSR
                    const cached = localStorage.getItem('currentUser');
                    if (cached) {
                        setUser(JSON.parse(cached));
                    }
                }
            })
            .catch(() => {
                // Backend unreachable — try localStorage cache
                const cached = localStorage.getItem('currentUser');
                if (cached) {
                    setUser(JSON.parse(cached));
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string): Promise<LoginResult> => {
        try {
            const data = await authApi.login(email, password);

            if (!data.success) {
                return {
                    success: false,
                    status: data.status as 'pending' | 'rejected' | undefined,
                };
            }

            const loggedInUser = data.user as unknown as User;
            setUser(loggedInUser);
            localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
            return { success: true, status: 'active' };
        } catch {
            return { success: false };
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch {
            // ignore logout errors
        }
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    const refreshUser = async () => {
        try {
            const data = await authApi.me();
            if (data.user) {
                setUser(data.user as unknown as User);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
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
