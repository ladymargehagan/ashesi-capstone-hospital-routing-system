'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Flag } from 'lucide-react';

interface FlagDataModalProps {
    hospitalId: number;
    referralId?: number;
    open: boolean;
    onClose: () => void;
}

const FLAG_CATEGORIES = [
    "Bed count mismatch",
    "Equipment listed as unavailable on arrival",
    "Incorrect department information",
    "Specialist not available",
    "Other"
];

export function FlagDataModal({ hospitalId, referralId, open, onClose }: FlagDataModalProps) {
    const [category, setCategory] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category) {
            setError('Please select a flag category.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/hospitals/${hospitalId}/flag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category,
                    notes,
                    referral_id: referralId
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setCategory('');
                    setNotes('');
                    onClose();
                }, 2000);
            } else {
                setError(data.message || 'Failed to submit data flag.');
            }
        } catch (err) {
            setError('A network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <Flag className="h-5 w-5" />
                        Flag Data Issue
                    </DialogTitle>
                    <DialogDescription>
                        Report inconsistent hospital data encountered during this referral. This will be reviewed by the Super Admin.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="py-6 text-center text-green-600 space-y-2">
                        <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <Flag className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium">Issue Reported</h3>
                        <p className="text-sm text-green-700">Thank you for helping keep the HRS network accurate.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-sm font-medium">Issue Category *</Label>
                            <Select value={category} onValueChange={setCategory} disabled={loading}>
                                <SelectTrigger id="category" className="w-full">
                                    <SelectValue placeholder="Select the type of issue" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FLAG_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-sm font-medium">Additional Notes (Optional)</Label>
                            <Textarea 
                                id="notes" 
                                placeholder="Provide more context about the discrepancy..." 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={loading}
                                className="resize-none"
                                rows={4}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</p>
                        )}

                        <DialogFooter className="mt-6 border-t pt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Report
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
