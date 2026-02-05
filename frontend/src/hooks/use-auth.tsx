'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@/types';
import { getCurrentUser, setCurrentUser as setStoredUser, findUserByEmail } from '@/lib/mock-data';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const storedUser = getCurrentUser();
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        // Simulated authentication - in production, this would call an API
        const foundUser = findUserByEmail(email);

        // For demo purposes, accept any password
        if (foundUser) {
            setUser(foundUser);
            setStoredUser(foundUser);
            return true;
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        setStoredUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
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
