'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Referral } from '@/types';
import { CheckCircle, XCircle } from 'lucide-react';

interface ReferralDetailsModalProps {
    referral: Referral | null;
    open: boolean;
    onClose: () => void;
}

export function ReferralDetailsModal({ referral, open, onClose }: ReferralDetailsModalProps) {
    const [responseNotes, setResponseNotes] = useState('');
    const [loading, setLoading] = useState(false);

    if (!referral) return null;

    const getUrgencyBadge = (urgency: string) => {
        const styles = {
            Emergency: 'bg-red-100 text-red-700 border-red-200',
            Urgent: 'bg-amber-100 text-amber-700 border-amber-200',
            Routine: 'bg-green-100 text-green-700 border-green-200',
        };
        return styles[urgency as keyof typeof styles] || styles.Routine;
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            Pending: 'bg-amber-100 text-amber-700',
            Accepted: 'bg-green-100 text-green-700',
            Rejected: 'bg-red-100 text-red-700',
        };
        return styles[status as keyof typeof styles] || styles.Pending;
    };

    const handleAction = async (action: 'accept' | 'reject') => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert(`Referral ${action}ed successfully!`);
        setLoading(false);
        onClose();
    };

    const isPending = referral.status === 'Pending';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Referral Details</DialogTitle>
                    <DialogDescription>
                        Review patient referral information
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Patient Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Patient Name</p>
                            <p className="font-semibold">{referral.patient_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Age</p>
                            <p className="font-semibold">{referral.patient_age} years</p>
                        </div>
                    </div>

                    {/* Condition */}
                    <div>
                        <p className="text-sm text-gray-500">Condition</p>
                        <p className="font-semibold">{referral.condition}</p>
                    </div>

                    {/* Urgency & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Urgency</p>
                            <Badge className={getUrgencyBadge(referral.urgency)} variant="outline">
                                {referral.urgency}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <Badge className={getStatusBadge(referral.status)}>
                                {referral.status}
                            </Badge>
                        </div>
                    </div>

                    {/* Referring Physician */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Referring Physician</p>
                            <p className="font-semibold">{referral.referring_physician_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Referring Clinic</p>
                            <p className="font-semibold">{referral.referring_facility}</p>
                        </div>
                    </div>

                    {/* Response Notes */}
                    {isPending && (
                        <div className="space-y-2">
                            <Label htmlFor="notes">Response Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Add any notes or comments..."
                                value={responseNotes}
                                onChange={(e) => setResponseNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    )}

                    {referral.response_notes && (
                        <div>
                            <p className="text-sm text-gray-500">Response Notes</p>
                            <p className="text-sm">{referral.response_notes}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {isPending && (
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleAction('reject')}
                                disabled={loading}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Referral
                            </Button>
                            <Button
                                className="flex-1 bg-gray-900 hover:bg-gray-800"
                                onClick={() => handleAction('accept')}
                                disabled={loading}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept Referral
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
