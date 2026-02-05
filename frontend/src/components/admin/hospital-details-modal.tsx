'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Hospital } from '@/types';
import { CheckCircle, XCircle } from 'lucide-react';

interface HospitalDetailsModalProps {
    hospital: Hospital | null;
    open: boolean;
    onClose: () => void;
}

export function HospitalDetailsModal({ hospital, open, onClose }: HospitalDetailsModalProps) {
    const [loading, setLoading] = useState(false);

    if (!hospital) return null;

    const handleAction = async (action: 'approve' | 'reject') => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert(`Hospital ${action}d successfully!`);
        setLoading(false);
        onClose();
    };

    const isPending = hospital.status === 'Pending';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Hospital Application Details</DialogTitle>
                    <DialogDescription>
                        Review complete hospital information
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

                    {/* Contact & Beds */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Contact Person</p>
                            <p className="font-semibold">{hospital.contact_person}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Beds</p>
                            <p className="font-semibold">{hospital.total_beds}</p>
                        </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-semibold text-sm">{hospital.contact_email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-semibold">{hospital.contact_phone}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isPending && (
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleAction('approve')}
                                disabled={loading}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Application
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleAction('reject')}
                                disabled={loading}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Application
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
