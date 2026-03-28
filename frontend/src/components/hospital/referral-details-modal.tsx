'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Referral, ReferralDetails, Physician, Hospital } from '@/types';
import { referralsApi, usersApi, hospitalsApi } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, FileText, CheckCircle, XCircle, AlertCircle, Clock, CheckCircle2, UserPlus, Paperclip, Navigation, MapPin, Send, Activity } from 'lucide-react';
import { TripMap } from './trip-map';
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

    const [showFlagForm, setShowFlagForm] = useState(false);
    const [flagCategory, setFlagCategory] = useState('');
    const [flagNotes, setFlagNotes] = useState('');
    const [flagLoading, setFlagLoading] = useState(false);

    const [showOutcomeForm, setShowOutcomeForm] = useState(false);
    const [finalOutcomeStatus, setFinalOutcomeStatus] = useState('');
    const [finalOutcome, setFinalOutcome] = useState('');

    const [transitUpdates, setTransitUpdates] = useState<any[]>([]);
    const [newTransitUpdate, setNewTransitUpdate] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);

    // Fetch full details when modal opens
    useEffect(() => {
        if (open && referral?.id) {
            setDetailsLoading(true);
            referralsApi.get(referral.id)
                .then((data) => setFullReferral(data))
                .catch(() => setFullReferral(null))
                .finally(() => setDetailsLoading(false));

            referralsApi.getTransitUpdates(referral.id)
                .then((data: any) => setTransitUpdates(data.updates || []))
                .catch(() => setTransitUpdates([]));

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
            in_transit: 'bg-blue-100 text-blue-700',
            completed: 'bg-gray-100 text-gray-700',
        };
        return styles[status] || styles.pending;
    };

    const handleAction = async (action: 'accept' | 'reject' | 'depart' | 'arrive' | 'complete') => {
        setLoading(true);
        setError(null);
        try {
            let status = '';
            if (action === 'accept') status = 'approved';
            else if (action === 'reject') status = 'rejected';
            else if (action === 'depart') status = 'in_transit';
            else if (action === 'arrive') status = 'arrived';
            else if (action === 'complete') status = 'completed';

            const payload: any = { status };
            if (action === 'reject' && responseNotes) {
                payload.reason = responseNotes;
            }

            await referralsApi.updateStatus(referral.id, payload.status, payload.reason);
            setResponseNotes('');
            const patientName = referral.patient_name
                || (referral as unknown as Record<string, { full_name?: string }>).patient?.full_name
                || 'the patient';
            if (action === 'accept') {
                toast.success(`Referral for ${patientName} has been accepted.`, 'Referral Accepted');
            } else if (action === 'reject') {
                toast.warning(`Referral for ${patientName} has been rejected.`, 'Referral Rejected');
            }
            onStatusChanged?.();
            onClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : `Failed to ${action} referral`;
            setError(message);
            toast.error(message, 'Action Failed');
            setLoading(false);
        }
    };

    const handleFlagSubmit = async () => {
        if (!flagCategory) {
            toast.error('Please select a flag category.', 'Missing Data');
            return;
        }
        setFlagLoading(true);
        try {
            await hospitalsApi.flagData(
                String(referral.referring_hospital_id),
                flagCategory,
                flagNotes,
                referral.id
            );
            toast.success('Hospital data flagged for review.', 'Flag Submitted');
            setShowFlagForm(false);
            setFlagCategory('');
            setFlagNotes('');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to submit flag', 'Error');
        } finally {
            setFlagLoading(false);
        }
    };

    const handleOutcomeSubmit = async () => {
        if (!finalOutcomeStatus) {
            toast.error('Please select a final status.', 'Missing Data');
            return;
        }
        if (!finalOutcome.trim()) {
            toast.error('Please provide a final outcome summary.', 'Missing Data');
            return;
        }
        setLoading(true);
        try {
            const combinedOutcome = `[${finalOutcomeStatus}] ${finalOutcome.trim()}`;
            await referralsApi.updateStatus(referral.id, 'completed', combinedOutcome);
            toast.success('Treatment marked completed and outcome recorded.', 'Completed');
            setShowOutcomeForm(false);
            onStatusChanged?.();
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to record outcome', 'Error');
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

    const handleTransitUpdateSubmit = async () => {
        if (!newTransitUpdate.trim()) return;
        setUpdateLoading(true);
        try {
            await referralsApi.addTransitUpdate(referral.id, newTransitUpdate);
            // Reload updates
            const data: any = await referralsApi.getTransitUpdates(referral.id);
            setTransitUpdates(data.updates || []);
            setNewTransitUpdate('');
            toast.success('Condition update posted successfully.');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to post update', 'Error');
        } finally {
            setUpdateLoading(false);
        }
    };

    // -------------------------------------------------------------------------
    // Role-based permission booleans
    // All IDs from the API are strings. Cast to string for safe comparison.
    // -------------------------------------------------------------------------
    const myHospitalId = String(user?.hospital_id ?? '');
    const myPhysicianId = String(user?.physician_id ?? '');
    const myRole = user?.role ?? '';

    // Hospital A = referring side
    const isAtReferringHospital = myHospitalId === referral.referring_hospital_id;
    // Hospital B = receiving side  
    const isAtReceivingHospital = myHospitalId === referral.receiving_hospital_id;
    // The doctor who sent the referral
    const isReferringPhysician = myPhysicianId === referral.referring_physician_id;
    // The doctor assigned to this case at Hospital B
    const isAssignedPhysician = myPhysicianId === referral.assigned_physician_id;
    // Any admin at the receiving hospital
    const isReceivingAdmin = myRole === 'hospital_admin' && isAtReceivingHospital;

    // --- Action guards ---
    // Only receiving hospital admin can approve/reject
    const isPending = referral.status === 'pending' && isReceivingAdmin;
    // Referring physician marks Patient Dispatched
    const canDispatch = referral.status === 'approved' && isReferringPhysician;
    // Referring physician can post transit condition updates
    const canPostUpdate = referral.status === 'in_transit' && isReferringPhysician;
    // Receiving admin (and assigned doctor) can see transit updates + mark arrived
    const canSeeTransitFeed = referral.status === 'in_transit' && (isAtReceivingHospital || isAtReferringHospital || isAssignedPhysician);
    const canMarkArrived = referral.status === 'in_transit' && (isReceivingAdmin || isAssignedPhysician);
    // Receiving doctor OR admin can mark patient as complete
    const canComplete = referral.status === 'arrived' && (isReceivingAdmin || isAssignedPhysician);
    // Referring physician can flag data inconsistency on an active/arrived referral
    const canFlag = isReferringPhysician && ['approved', 'in_transit', 'arrived'].includes(referral.status);

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
                        {user?.role === 'hospital_admin' && user?.hospital_id === referral.receiving_hospital_id && ['approved', 'in_transit', 'arrived'].includes(referral.status) && (
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

                        {/* Patient Dispatched — Referring Physician Only, status=approved */}
                        {canDispatch && (
                            <div className="flex justify-end pt-2 border-t mt-4">
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => handleAction('depart')}
                                    disabled={loading}
                                >
                                    <Navigation className="h-4 w-4 mr-2" />
                                    Patient Dispatched
                                </Button>
                            </div>
                        )}

                        {/* In Transit Panel — Live Feed + Map + Arrived Button */}
                        {canSeeTransitFeed && (
                            <div className="pt-2 border-t mt-4 space-y-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-blue-500" />
                                        Live Condition Updates
                                    </h3>
                                    
                                    <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto pr-2">
                                        {transitUpdates.length === 0 ? (
                                            <p className="text-xs text-slate-500 italic">No condition updates logged yet.</p>
                                        ) : (
                                            transitUpdates.map(u => (
                                                <div key={u.update_id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-semibold text-slate-700">{u.logger_name || 'Doctor'}</span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(u.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{u.update_text}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Only referring physician can type updates */}
                                    {canPostUpdate && (
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="Add a condition update..." 
                                                value={newTransitUpdate}
                                                onChange={(e) => setNewTransitUpdate(e.target.value)}
                                                className="bg-white text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleTransitUpdateSubmit();
                                                    }
                                                }}
                                            />
                                            <Button 
                                                size="icon" 
                                                className="bg-blue-600 hover:bg-blue-700 shrink-0"
                                                onClick={handleTransitUpdateSubmit}
                                                disabled={updateLoading || !newTransitUpdate.trim()}
                                            >
                                                {updateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <TripMap
                                    originLat={5.56}
                                    originLng={-0.20}
                                    destinationLat={5.58} 
                                    destinationLng={-0.18}
                                    originName={referral.referring_hospital_name || ''}
                                    destinationName={referral.receiving_hospital_name || ''}
                                />
                                {/* Receiving admin OR assigned doctor can mark arrived */}
                                {canMarkArrived && (
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            className="bg-purple-600 hover:bg-purple-700 text-white"
                                            onClick={() => handleAction('arrive')}
                                            disabled={loading}
                                        >
                                            <MapPin className="h-4 w-4 mr-2" />
                                            Mark as Arrived (Admitted)
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Treatment Conclusion — shown to receiving admin OR assigned doctor when status=arrived */}
                        {canComplete && (
                            <div className="pt-4 border-t mt-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-900">Treatment Conclusion</h4>
                                    <Button
                                        variant="outline"
                                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                        onClick={() => setShowFlagForm(!showFlagForm)}
                                    >
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Flag Inconsistent Data
                                    </Button>
                                </div>

                                {/* Flag Form */}
                                {showFlagForm && (
                                    <div className="bg-amber-50 p-4 rounded-lg space-y-3 border border-amber-200">
                                        <h5 className="font-medium text-amber-900 text-sm">Report Inconsistent Hospital Data</h5>
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <Select value={flagCategory} onValueChange={setFlagCategory}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select issue category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Bed count mismatch">Bed count mismatch</SelectItem>
                                                    <SelectItem value="Equipment listed as unavailable on arrival">Equipment listed as unavailable on arrival</SelectItem>
                                                    <SelectItem value="Incorrect department information">Incorrect department information</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Notes (Optional)</Label>
                                            <Textarea
                                                value={flagNotes}
                                                onChange={(e) => setFlagNotes(e.target.value)}
                                                placeholder="Provide more details..."
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" onClick={() => setShowFlagForm(false)}>Cancel</Button>
                                            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleFlagSubmit} disabled={flagLoading}>
                                                Submit Flag
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Outcome Form */}
                                {!showOutcomeForm ? (
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => setShowOutcomeForm(true)}
                                            disabled={loading}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Mark Treatment Completed
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 p-4 rounded-lg space-y-3 border border-green-200 pt-2 border-t mt-4">
                                        <h5 className="font-medium text-green-900 text-sm">Final Referral Outcome</h5>
                                        <p className="text-xs text-green-700">Select a status and provide a typed summary for the referring doctor before closing.</p>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-green-800">Final Patient Status</Label>
                                            <Select value={finalOutcomeStatus} onValueChange={setFinalOutcomeStatus}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select final status..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Discharged">Discharged</SelectItem>
                                                    <SelectItem value="Admitted to Ward">Admitted to Ward</SelectItem>
                                                    <SelectItem value="Transferred to ICU">Transferred to ICU</SelectItem>
                                                    <SelectItem value="Referred to Another Facility">Referred to Another Facility</SelectItem>
                                                    <SelectItem value="Absconded">Absconded</SelectItem>
                                                    <SelectItem value="Deceased">Deceased</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-green-800">Typed Summary</Label>
                                            <Textarea
                                                value={finalOutcome}
                                                onChange={(e) => setFinalOutcome(e.target.value)}
                                                placeholder="Patient safely stabilized, observation completed... etc."
                                                rows={3}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button variant="ghost" onClick={() => setShowOutcomeForm(false)}>Cancel</Button>
                                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleOutcomeSubmit} disabled={loading}>
                                                Submit & Complete
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Referring physician data flag — for approved/in_transit/arrived referrals */}
                        {canFlag && !canComplete && (
                            <div className="pt-4 border-t mt-4">
                                <div className="flex justify-end">
                                    <Button
                                        variant="outline"
                                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                        onClick={() => setShowFlagForm(!showFlagForm)}
                                    >
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Flag Inconsistent Data
                                    </Button>
                                </div>
                                {showFlagForm && (
                                    <div className="bg-amber-50 p-4 rounded-lg space-y-3 border border-amber-200 mt-3">
                                        <h5 className="font-medium text-amber-900 text-sm">Report Inconsistent Hospital Data</h5>
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <Select value={flagCategory} onValueChange={setFlagCategory}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select issue category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Bed count mismatch">Bed count mismatch</SelectItem>
                                                    <SelectItem value="Equipment listed as unavailable on arrival">Equipment listed as unavailable on arrival</SelectItem>
                                                    <SelectItem value="Incorrect department information">Incorrect department information</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Notes (Optional)</Label>
                                            <Textarea
                                                value={flagNotes}
                                                onChange={(e) => setFlagNotes(e.target.value)}
                                                placeholder="Provide more details..."
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" onClick={() => setShowFlagForm(false)}>Cancel</Button>
                                            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleFlagSubmit} disabled={flagLoading}>
                                                Submit Flag
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
