'use client';

import { useEffect } from 'react';

/**
 * Forces light mode for the page it is rendered on.
 * Removes the `dark` class from <html> on mount and restores the user's
 * stored preference on unmount (i.e. when navigating into the app).
 */
export function ForceLight() {
    useEffect(() => {
        const html = document.documentElement;
        const hadDark = html.classList.contains('dark');

        html.classList.remove('dark');
        html.dataset.theme = 'light';
        html.style.colorScheme = 'light';

        return () => {
            if (hadDark) {
                html.classList.add('dark');
                html.dataset.theme = 'dark';
                html.style.colorScheme = 'dark';
            }
        };
    }, []);

    return null;
}
