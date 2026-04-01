'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertCircle, Building2, Tag, Phone, Search, Users, ShieldAlert, Loader2 } from 'lucide-react';
import { hospitalsApi } from '@/lib/api-client';

interface Flag {
    flag_id: number;
    category: string;
    notes?: string;
    created_at: string;
    flagging_physician_name?: string;
}

interface Resource {
    resource_type: string;
    total_count: number;
    available_count: number;
    is_available: boolean;
}

interface Specialist {
    specialty: string;
    specialist_name: string;
    on_call_available: boolean;
}

interface FullHospital {
    id: number;
    name: string;
    level: string;
    type: string;
    ownership: string;
    address: string;
    contact_phone?: string;
    gps_coordinates?: { lat: number; lng: number };
    active_flags?: Flag[];
    resources?: Resource[];
    specialists?: Specialist[];
}

interface HospitalDetailsModalProps {
    hospitalId: number | string | null;
    open: boolean;
    onClose: () => void;
}

export function HospitalDetailsModal({ hospitalId, open, onClose }: HospitalDetailsModalProps) {
    const [hospital, setHospital] = useState<FullHospital | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && hospitalId) {
            setLoading(true);
            hospitalsApi.get(hospitalId.toString())
                .then(data => setHospital(data as unknown as FullHospital))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [open, hospitalId]);

    const getResourceDisplayName = (type: string): string => {
        const names: Record<string, string> = {
            general_beds: 'General Beds',
            icu_beds: 'ICU Beds',
            pediatric_beds: 'Pediatric Beds',
            maternity_beds: 'Maternity Beds',
            theatre: 'Operating Theatre',
            blood_bank: 'Blood Bank',
            lab: 'Laboratory',
            xray: 'X-Ray',
            ct_scan: 'CT Scan',
            mri: 'MRI',
            ultrasound: 'Ultrasound',
            dialysis: 'Dialysis',
            ventilators: 'Ventilators',
            oxygen: 'Oxygen Supply',
        };
        return names[type] || type.replace('_', ' ');
    };

    if (!hospitalId && !open) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogTitle className="sr-only">Hospital Details</DialogTitle>
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : hospital ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center justify-between mt-2">
                                <div>
                                    <DialogTitle className="text-2xl flex items-center gap-2">
                                        <Building2 className="w-6 h-6 text-primary" />
                                        {hospital.name}
                                    </DialogTitle>
                                    <DialogDescription className="flex items-center gap-2 mt-1">
                                        <MapPin className="w-4 h-4" />
                                        {hospital.address}
                                    </DialogDescription>
                                </div>
                                <Badge className={hospital.level === 'teaching' ? 'bg-purple-100 text-purple-700' : 'bg-primary/10 text-secondary'}>
                                    {hospital.level.replace('_', ' ')}
                                </Badge>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                            {/* Flags Alert Box */}
                            {hospital.active_flags && hospital.active_flags.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <h4 className="flex items-center gap-2 font-semibold text-amber-900 mb-2">
                                        <ShieldAlert className="w-4 h-4" />
                                        Active Data Flags ({hospital.active_flags.length})
                                    </h4>
                                    <p className="text-xs text-amber-700 mb-3">
                                        Physicians have reported potential inconsistencies with this hospital's data.
                                    </p>
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                        {hospital.active_flags.map(flag => (
                                            <div key={flag.flag_id} className="bg-white border rounded p-2 text-sm shadow-sm">
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-amber-900">{flag.category}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(flag.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {flag.notes && <p className="text-gray-700 mt-1 italic text-xs">"{flag.notes}"</p>}
                                                <p className="text-xs text-gray-400 mt-1">Reported by Dr. {flag.flagging_physician_name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Core Info & Map */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Facility Details</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Level</span>
                                                <span className="capitalize font-medium">{hospital.level?.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Ownership</span>
                                                <span className="capitalize font-medium">{hospital.ownership}</span>
                                            </div>
                                            {hospital.contact_phone && (
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                                    <span className="text-gray-500 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> Contact
                                                    </span>
                                                    <span className="font-medium text-primary">{hospital.contact_phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Users className="w-4 h-4" /> Specialists on Record
                                        </h4>
                                        {hospital.specialists && hospital.specialists.length > 0 ? (
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                                {hospital.specialists.map((s, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border shadow-sm">
                                                        <div>
                                                            <p className="font-medium">{s.specialist_name}</p>
                                                            <p className="text-xs text-gray-500">{s.specialty}</p>
                                                        </div>
                                                        <Badge variant={s.on_call_available ? 'outline' : 'secondary'} className={s.on_call_available ? 'text-green-600 border-green-200 bg-green-50' : ''}>
                                                            {s.on_call_available ? 'On Call' : 'Unavailable'}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No specialist data available.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg h-full max-h-96">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Search className="w-4 h-4" /> Resource Availability
                                        </h4>
                                        {hospital.resources && hospital.resources.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1" style={{ maxHeight: 'inherit' }}>
                                                {hospital.resources.map(res => (
                                                    <div key={res.resource_type} className={`p-2 rounded border text-sm flex flex-col justify-between ${res.available_count > 0 ? 'bg-white border-green-100' : 'bg-red-50 border-red-100'}`}>
                                                        <span className="text-xs font-medium text-gray-700 block mb-1">
                                                            {getResourceDisplayName(res.resource_type)}
                                                        </span>
                                                        <div className="flex items-end justify-between">
                                                            <span className={`text-lg font-bold leading-none ${res.available_count > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                                {res.available_count}
                                                            </span>
                                                            <span className="text-xs text-gray-400">/ {res.total_count}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No resource tracking data.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </>
                ) : (
                    <div className="text-center p-8 text-gray-500">
                        Failed to load hospital details.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
