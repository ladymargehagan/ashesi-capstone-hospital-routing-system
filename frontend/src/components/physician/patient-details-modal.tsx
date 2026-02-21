'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Patient } from '@/types';
import { User, Calendar, Phone, MapPin, Shield, Heart, UserCheck } from 'lucide-react';

interface PatientDetailsModalProps {
    patient: Patient | null;
    open: boolean;
    onClose: () => void;
}

export function PatientDetailsModal({ patient, open, onClose }: PatientDetailsModalProps) {
    if (!patient) return null;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const getAge = (dob?: string) => {
        if (!dob) return '-';
        const today = new Date();
        const birth = new Date(dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const getNHISBadge = (status?: string) => {
        if (!status) return 'bg-gray-100 text-gray-700 border-gray-200';
        const styles: Record<string, string> = {
            Active: 'bg-green-100 text-green-700 border-green-200',
            Expired: 'bg-amber-100 text-amber-700 border-amber-200',
            None: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return styles[status] || styles.None;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl">Patient Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                    {/* Name & ID */}
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900">{patient.full_name}</h3>
                            <p className="text-sm text-gray-500">ID: {patient.patient_identifier}</p>
                        </div>
                    </div>

                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Date of Birth</p>
                                <p className="text-sm font-medium">{formatDate(patient.date_of_birth)}</p>
                                <p className="text-xs text-gray-400">Age: {getAge(patient.date_of_birth)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Sex</p>
                                <p className="text-sm font-medium capitalize">{patient.sex || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Contact</p>
                                <p className="text-sm font-medium">{patient.contact_number || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Address</p>
                                <p className="text-sm font-medium">{patient.address || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Insurance */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-gray-400" />
                            <p className="text-xs text-gray-500 font-medium">NHIS Insurance</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={getNHISBadge(patient.nhis_status)} variant="outline">
                                {patient.nhis_status || 'None'}
                            </Badge>
                            {patient.nhis_number && (
                                <span className="text-sm text-gray-600">#{patient.nhis_number}</span>
                            )}
                        </div>
                    </div>

                    {/* Medical */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Heart className="h-4 w-4 text-gray-400" />
                            <p className="text-xs text-gray-500 font-medium">Medical Info</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-gray-500">Current Diagnosis</p>
                                <p className="text-sm font-medium text-blue-700">{patient.diagnosis || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Last Visit</p>
                                <p className="text-sm font-medium">{formatDate(patient.last_visit)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Next of Kin */}
                    {(patient.next_of_kin_name || patient.next_of_kin_contact) && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <UserCheck className="h-4 w-4 text-gray-400" />
                                <p className="text-xs text-gray-500 font-medium">Next of Kin</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-gray-500">Name</p>
                                    <p className="text-sm font-medium">{patient.next_of_kin_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Contact</p>
                                    <p className="text-sm font-medium">{patient.next_of_kin_contact || '-'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Registration */}
                    <p className="text-xs text-gray-400 text-right">
                        Registered: {formatDate(patient.registered_at)}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
