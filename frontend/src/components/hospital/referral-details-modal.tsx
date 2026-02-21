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

    const getSeverityBadge = (severity: string) => {
        const styles: Record<string, string> = {
            critical: 'bg-red-100 text-red-700 border-red-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            medium: 'bg-amber-100 text-amber-700 border-amber-200',
            low: 'bg-green-100 text-green-700 border-green-200',
        };
        return styles[severity] || styles.low;
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
            en_route: 'bg-blue-100 text-blue-700',
            completed: 'bg-gray-100 text-gray-700',
        };
        return styles[status] || styles.pending;
    };

    const handleAction = async (action: 'accept' | 'reject') => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert(`Referral ${action}ed successfully!`);
        setLoading(false);
        onClose();
    };

    const isPending = referral.status === 'pending';

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

                    {/* Severity & Stability */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Severity</p>
                            <Badge className={getSeverityBadge(referral.severity)} variant="outline">
                                {referral.severity}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Stability</p>
                            <Badge className={referral.stability === 'stable' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} variant="outline">
                                {referral.stability}
                            </Badge>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <Badge className={getStatusBadge(referral.status)}>
                            {referral.status}
                        </Badge>
                    </div>

                    {/* Referring Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Referring Physician</p>
                            <p className="font-semibold">{referral.referring_physician_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Referring Hospital</p>
                            <p className="font-semibold">{referral.referring_hospital_name}</p>
                        </div>
                    </div>

                    {/* Estimated Arrival */}
                    {referral.estimated_arrival_minutes && (
                        <div>
                            <p className="text-sm text-gray-500">Estimated Arrival</p>
                            <p className="font-semibold">{referral.estimated_arrival_minutes} minutes</p>
                        </div>
                    )}

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
