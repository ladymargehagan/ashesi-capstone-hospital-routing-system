'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
}

const STORAGE_KEY = 'hrs-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeMode) {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
}

function getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') {
        return 'light';
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme());

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const setTheme = (nextTheme: ThemeMode) => {
        setThemeState(nextTheme);
        applyTheme(nextTheme);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, nextTheme);
        }
    };

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        setTheme,
        toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
