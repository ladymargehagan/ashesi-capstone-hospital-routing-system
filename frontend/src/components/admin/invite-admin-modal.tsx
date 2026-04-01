'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hospital } from '@/types';
import { superAdminApi } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast-provider';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';

interface InviteAdminModalProps {
    open: boolean;
    onClose: () => void;
    hospitals: Hospital[];
}

export function InviteAdminModal({ open, onClose, hospitals }: InviteAdminModalProps) {
    const [email, setEmail] = useState('');
    const [hospitalId, setHospitalId] = useState('');
    const [loading, setLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [copied, setCopied] = useState(false);
    const toast = useToast();

    // Only show active and pending hospitals (or just active)
    // Actually, admins should be invited to active hospitals, but pending is fine too.
    const activeHospitals = hospitals.filter(h => h.status === 'active' || h.status === 'pending');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !hospitalId) {
            toast.error('Please provide an email and select a hospital.');
            return;
        }

        setLoading(true);
        try {
            const res = await superAdminApi.generateInvite(email, hospitalId);
            setInviteLink(res.invite_link);
            setEmailSent(res.email_sent);
            if (res.email_sent) {
                toast.success(`Invite emailed to ${email}!`);
            } else {
                toast.success('Invite generated — email not configured, share the link manually.');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to generate invite';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Invite link copied to clipboard');
    };

    const handleClose = () => {
        setEmail('');
        setHospitalId('');
        setInviteLink('');
        setCopied(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite Hospital Admin</DialogTitle>
                    <DialogDescription>
                        Generate a secure registration link for a new hospital administrator.
                    </DialogDescription>
                </DialogHeader>

                {!inviteLink ? (
                    <form onSubmit={handleInvite} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Admin Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@hospital.gov.gh"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hospital">Assign to Hospital</Label>
                            <Select value={hospitalId} onValueChange={setHospitalId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a hospital" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {activeHospitals.map(h => (
                                        <SelectItem key={h.id} value={h.id.toString()}>
                                            {h.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-secondary" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate Invite Link
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-start gap-3 border border-green-200">
                            <CheckCircle2 className="h-5 w-5 mt-0.5" />
                            <div>
                                <h4 className="font-medium">Invite Generated</h4>
                                <p className="text-sm mt-1">
                                    {emailSent
                                        ? `An invitation email has been sent to ${email}. They can also use the link below.`
                                        : `Copy the link below and send it to ${email} to complete their registration.`
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Registration Link</Label>
                            <div className="flex gap-2">
                                <Input readOnly value={inviteLink} className="bg-slate-50 font-mono text-xs" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="shrink-0"
                                    onClick={handleCopy}
                                >
                                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" onClick={handleClose} className="w-full">
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
