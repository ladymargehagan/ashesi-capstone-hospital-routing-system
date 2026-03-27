'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Search, MapPin, Tag, Loader2, AlertCircle } from 'lucide-react';

// Shape of a hospital record from GET /api/hospitals
interface Hospital {
    id: number;
    name: string;
    level: string;
    type: string;
    ownership: string;
    address: string;
    status: string;
    contact_phone?: string;
    gps_coordinates?: string;
}

const LEVEL_COLORS: Record<string, string> = {
    teaching:      'bg-purple-100 text-purple-800',
    regional:      'bg-blue-100   text-blue-800',
    district:      'bg-green-100  text-green-800',
    polyclinic:    'bg-yellow-100 text-yellow-800',
    health_centre: 'bg-orange-100 text-orange-800',
    chps:          'bg-gray-100   text-gray-700',
};

export default function HospitalsDirectoryPage() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [filtered, setFiltered] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('');

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/hospitals`, {
            credentials: 'include',
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to load hospitals');
                return res.json();
            })
            .then((data: Hospital[]) => {
                setHospitals(data);
                setFiltered(data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // Filter hospitals when search text or level filter changes
    const applyFilters = useCallback(() => {
        let list = hospitals;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(h =>
                h.name.toLowerCase().includes(q) ||
                h.address?.toLowerCase().includes(q)
            );
        }
        if (levelFilter) {
            list = list.filter(h => h.level === levelFilter);
        }
        setFiltered(list);
    }, [hospitals, search, levelFilter]);

    useEffect(() => { applyFilters(); }, [applyFilters]);

    const uniqueLevels = Array.from(new Set(hospitals.map(h => h.level))).sort();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span>Loading hospitals…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Hospital Directory</h1>
                    <p className="text-sm text-gray-500">
                        {hospitals.length} facilities currently onboarded in Greater Accra
                    </p>
                </div>
            </div>

            {/* Search + filter bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or area…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>
                <select
                    value={levelFilter}
                    onChange={e => setLevelFilter(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                    <option value="">All levels</option>
                    {uniqueLevels.map(l => (
                        <option key={l} value={l}>{l.replace('_', ' ')}</option>
                    ))}
                </select>
            </div>

            {/* Result count */}
            <p className="text-xs text-gray-400">
                Showing {filtered.length} of {hospitals.length} hospitals
            </p>

            {/* Hospital cards grid */}
            {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
                    <Building2 className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    <p>No hospitals match your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(hospital => (
                        <div
                            key={hospital.id}
                            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                        >
                            {/* Name + level badge */}
                            <div className="flex items-start justify-between gap-2">
                                <h2 className="text-sm font-semibold text-gray-900 leading-snug">
                                    {hospital.name}
                                </h2>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${LEVEL_COLORS[hospital.level] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {hospital.level?.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Address */}
                            {hospital.address && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                    <span>{hospital.address}</span>
                                </div>
                            )}

                            {/* Type + ownership */}
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {hospital.type && (
                                    <div className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
                                        <Tag className="h-3 w-3" />
                                        {hospital.type.replace('_', ' ')}
                                    </div>
                                )}
                                {hospital.ownership && (
                                    <div className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
                                        {hospital.ownership.replace('_', ' ')}
                                    </div>
                                )}
                            </div>

                            {/* Phone (if present) */}
                            {hospital.contact_phone && (
                                <p className="mt-3 text-xs text-blue-600 font-medium">
                                    📞 {hospital.contact_phone}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
