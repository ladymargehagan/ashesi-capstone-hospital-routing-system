/* Extend the Window interface for Google Maps global properties */
declare global {
    interface Window {
        google: typeof google;
        __GOOGLE_MAPS_KEY?: string;
    }
}

export { };
