'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Hospital } from '@/types';

interface HospitalDetailsModalProps {
    hospital: Hospital | null;
    open: boolean;
    onClose: () => void;
}

export function HospitalDetailsModal({ hospital, open, onClose }: HospitalDetailsModalProps) {
    if (!hospital) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Hospital Details</DialogTitle>
                    <DialogDescription>
                        View hospital information
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Hospital Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Hospital Name</p>
                            <p className="font-semibold">{hospital.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="font-semibold">{hospital.type}</p>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-semibold">{hospital.address}</p>
                    </div>

                    {/* Contact & Level */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Contact Phone</p>
                            <p className="font-semibold">{hospital.contact_phone || '—'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Level</p>
                            <p className="font-semibold">{(hospital.level || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        </div>
                    </div>

                    {/* Ownership & License */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Ownership</p>
                            <p className="font-semibold">{hospital.ownership}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">License Number</p>
                            <p className="font-semibold text-sm">{hospital.license_number}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
