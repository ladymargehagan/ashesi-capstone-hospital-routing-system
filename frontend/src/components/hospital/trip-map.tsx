'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TripMapProps {
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
    originName: string;
    destinationName: string;
}

const containerStyle = {
    width: '100%',
    height: '300px'
};

export function TripMap({
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    originName,
    destinationName
}: TripMapProps) {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [distance, setDistance] = useState<string>('');
    const [duration, setDuration] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch API key securely from backend
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/maps-key`)
            .then(res => res.json())
            .then(data => {
                if (data.key) setApiKey(data.key);
                else setError('Google Maps not configured');
            })
            .catch(() => setError('Failed to load Maps config'));
    }, []);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey || '',
    });

    const onLoad = useCallback(
        function onLoad() {
            if (!apiKey) return;

            const directionsService = new window.google.maps.DirectionsService();

            directionsService.route(
                {
                    origin: new window.google.maps.LatLng(originLat, originLng),
                    destination: new window.google.maps.LatLng(destinationLat, destinationLng),
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK && result) {
                        setDirections(result);
                        if (result.routes[0]?.legs[0]) {
                            setDistance(result.routes[0].legs[0].distance?.text || '');
                            setDuration(result.routes[0].legs[0].duration?.text || '');
                        }
                    } else {
                        setError('Could not calculate driving route.');
                    }
                }
            );
        },
        [originLat, originLng, destinationLat, destinationLng, apiKey]
    );

    if (error) {
        return (
            <div className="w-full h-[300px] bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200">
                <div className="text-gray-500 flex flex-col items-center">
                    <MapPin className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">{error}</p>
                    <p className="text-xs">Map visualization is unavailable.</p>
                </div>
            </div>
        );
    }

    if (!isLoaded || !apiKey) {
        return (
            <div className="w-full h-[300px] bg-gray-50 flex items-center justify-center rounded-lg border border-gray-200">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-500">Loading Map...</span>
            </div>
        );
    }

    if (loadError) {
        return <div>Error loading maps</div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-sm px-1">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span className="font-medium text-gray-700">{originName}</span>
                </div>
                {duration && (
                    <div className="px-3 py-1 bg-green-50 text-green-700 font-semibold rounded-full border border-green-200">
                        {duration} ({distance})
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">{destinationName}</span>
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                </div>
            </div>
            <Card className="overflow-hidden border shadow-sm">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={{ lat: originLat, lng: originLng }}
                    zoom={10}
                    onLoad={onLoad}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: false,
                    }}
                >
                    {directions && (
                        <DirectionsRenderer
                            directions={directions}
                            options={{
                                suppressMarkers: false,
                                polylineOptions: {
                                    strokeColor: '#3b82f6',
                                    strokeWeight: 5,
                                },
                            }}
                        />
                    )}
                </GoogleMap>
            </Card>
        </div>
    );
}
