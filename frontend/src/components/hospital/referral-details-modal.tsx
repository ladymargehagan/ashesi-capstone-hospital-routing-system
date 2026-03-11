'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Referral, ReferralDetails, Physician } from '@/types';
import { referralsApi, usersApi } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { CheckCircle, XCircle, UserPlus, Loader2, FileText, Paperclip } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

interface ReferralDetailsModalProps {
    referral: Referral | null;
    open: boolean;
    onClose: () => void;
    onStatusChanged?: () => void;
}

export function ReferralDetailsModal({ referral, open, onClose, onStatusChanged }: ReferralDetailsModalProps) {
    const { user } = useAuth();
    const [responseNotes, setResponseNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fullReferral, setFullReferral] = useState<Record<string, unknown> | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [physicians, setPhysicians] = useState<Physician[]>([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const toast = useToast();

    // Fetch full details when modal opens
    useEffect(() => {
        if (open && referral?.id) {
            setDetailsLoading(true);
            referralsApi.get(referral.id)
                .then((data) => setFullReferral(data))
                .catch(() => setFullReferral(null))
                .finally(() => setDetailsLoading(false));

            // Load physicians at this hospital for assignment
            if (user?.hospital_id) {
                usersApi.listPhysicians({ hospital_id: user.hospital_id, status: 'active' })
                    .then((data) => setPhysicians(data as unknown as Physician[]))
                    .catch(() => setPhysicians([]));
            }
        }
    }, [open, referral?.id, user?.hospital_id]);

    if (!referral) return null;

    const details = (fullReferral?.details || referral.details || {}) as Partial<ReferralDetails>;
    const attachments = (fullReferral?.attachments || referral.attachments || []) as Array<{ id: string; file_name: string; file_type: string; file_size_bytes: number }>;

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
        setError(null);
        try {
            const status = action === 'accept' ? 'approved' : 'rejected';
            await referralsApi.updateStatus(
                referral.id,
                status,
                responseNotes || undefined,
            );
            setResponseNotes('');
            const patientName = referral.patient_name
                || (referral as unknown as Record<string, { full_name?: string }>).patient?.full_name
                || 'the patient';
            if (action === 'accept') {
                toast.success(`Referral for ${patientName} has been accepted.`, 'Referral Accepted');
            } else {
                toast.warning(`Referral for ${patientName} has been rejected.`, 'Referral Rejected');
            }
            onStatusChanged?.();
            onClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : `Failed to ${action} referral`;
            setError(message);
            toast.error(message, 'Action Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (physicianId: string) => {
        setAssignLoading(true);
        try {
            await referralsApi.assign(referral.id, physicianId);
            toast.success('Referral assigned to physician.', 'Assigned');
            onStatusChanged?.();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to assign referral';
            toast.error(message, 'Assignment Failed');
        } finally {
            setAssignLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isPending = referral.status === 'pending';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Referral Details</DialogTitle>
                    <DialogDescription>
                        Full referral information and clinical details
                    </DialogDescription>
                </DialogHeader>

                {detailsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="space-y-5 mt-4">
                        {/* Patient Info */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Patient Information</h3>
                            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500">Name</p>
                                    <p className="font-medium text-sm">{referral.patient_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Age</p>
                                    <p className="font-medium text-sm">{referral.patient_age} years</p>
                                </div>
                            </div>
                        </div>

                        {/* Severity & Status */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Severity</p>
                                <Badge className={getSeverityBadge(referral.severity)} variant="outline">
                                    {referral.severity}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Stability</p>
                                <Badge className={referral.stability === 'stable' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} variant="outline">
                                    {referral.stability}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Status</p>
                                <Badge className={getStatusBadge(referral.status)}>
                                    {referral.status}
                                </Badge>
                            </div>
                        </div>

                        {/* Referring Info */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Referral Origin</h3>
                            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500">Referring Physician</p>
                                    <p className="font-medium text-sm">{referral.referring_physician_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Referring Hospital</p>
                                    <p className="font-medium text-sm">{referral.referring_hospital_name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Clinical Details */}
                        {details && Object.values(details).some(v => v) && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Clinical Details
                                </h3>
                                <div className="space-y-3 bg-blue-50 p-3 rounded-lg">
                                    {details.presenting_complaint && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-700">Presenting Complaint</p>
                                            <p className="text-sm text-gray-800">{details.presenting_complaint}</p>
                                        </div>
                                    )}
                                    {details.clinical_history && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-700">Clinical History</p>
                                            <p className="text-sm text-gray-800">{details.clinical_history}</p>
                                        </div>
                                    )}
                                    {details.examination_findings && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-700">Examination Findings</p>
                                            <p className="text-sm text-gray-800">{details.examination_findings}</p>
                                        </div>
                                    )}
                                    {(details.working_diagnosis || details.initial_diagnosis) && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-700">Working Diagnosis</p>
                                            <p className="text-sm text-gray-800">{details.working_diagnosis || details.initial_diagnosis}</p>
                                        </div>
                                    )}
                                    {details.investigations_done && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-700">Investigations Done</p>
                                            <p className="text-sm text-gray-800">{details.investigations_done}</p>
                                        </div>
                                    )}
                                    {details.treatment_given && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-700">Treatment Given</p>
                                            <p className="text-sm text-gray-800">{details.treatment_given}</p>
                                        </div>
                                    )}
                                    {details.reason_for_referral && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-700">Reason for Referral</p>
                                            <p className="text-sm text-gray-800">{details.reason_for_referral}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Attachments */}
                        {attachments.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    Attachments ({attachments.length})
                                </h3>
                                <div className="space-y-1">
                                    {attachments.map((att) => (
                                        <div key={att.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                            <a
                                                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/referrals/attachments/${att.id}/download`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                {att.file_name}
                                            </a>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 text-xs">{formatFileSize(att.file_size_bytes)}</span>
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/referrals/attachments/${att.id}/download`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Download"
                                                >
                                                    ↓
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Assign Doctor (hospital admin only) */}
                        {user?.role === 'hospital_admin' && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Assign to Doctor
                                </h3>
                                {referral.assigned_physician_name && (
                                    <p className="text-sm text-green-700 mb-2">
                                        Currently assigned to: <strong>{referral.assigned_physician_name}</strong>
                                    </p>
                                )}
                                <Select
                                    onValueChange={handleAssign}
                                    disabled={assignLoading}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={assignLoading ? 'Assigning...' : 'Select a physician'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {physicians.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.full_name || p.license_number} — {p.specialization || 'General'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                        {/* Error */}
                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
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
                )}
            </DialogContent>
        </Dialog>
    );
}
