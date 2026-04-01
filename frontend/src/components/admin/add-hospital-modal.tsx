'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hospitalsApi } from '@/lib/api-client';
import { Loader2, Plus, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

interface AddHospitalModalProps {
    open: boolean;
    onClose: () => void;
    onAdded?: () => void;
}

export function AddHospitalModal({ open, onClose, onAdded }: AddHospitalModalProps) {
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState<{ invite_token?: string } | null>(null);
    const toast = useToast();
    const [copied, setCopied] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        level: 'district',
        ownership: 'public',
        contact_phone: '',
        email: '',
        admin_email: '',
        general_beds: 0,
        icu_beds: 0,
    });

    const handleCopy = () => {
        if (successData?.invite_token) {
            const inviteLink = `${window.location.origin}/register?invite=${successData.invite_token}`;
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const initialResources = [];
            if (formData.general_beds >= 0) {
                initialResources.push({ resource_type: 'general_beds', total_count: formData.general_beds, available_count: formData.general_beds, is_available: formData.general_beds > 0 });
            }
            if (formData.icu_beds >= 0) {
                initialResources.push({ resource_type: 'icu_beds', total_count: formData.icu_beds, available_count: formData.icu_beds, is_available: formData.icu_beds > 0 });
            }

            const reqBody = {
                name: formData.name,
                address: formData.address,
                level: formData.level,
                ownership: formData.ownership,
                contact_phone: formData.contact_phone,
                email: formData.email,
                admin_email: formData.admin_email,
                initial_resources: initialResources
            };

            const res = await hospitalsApi.create(reqBody);
            
            if (res.success) {
                setSuccessData({ invite_token: res.invite_token });
                onAdded?.();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to create hospital');
        } finally {
            setLoading(false);
        }
    };

    if (successData) {
        return (
            <Dialog open={open} onOpenChange={() => { onClose(); setSuccessData(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-green-600 flex items-center gap-2">
                            <Check className="h-5 w-5" />
                            Hospital Added Successfully
                        </DialogTitle>
                        <DialogDescription>
                            The hospital has been created (Inactive) and is pending activation via checklist.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {successData.invite_token && (
                        <div className="bg-gray-50 border rounded-lg p-4 mt-2">
                            <p className="text-sm font-medium text-gray-900 mb-2">Admin Invite Link Generated</p>
                            <p className="text-xs text-gray-500 mb-3">Share this link directly with the hospital admin so they can register and bypass standard approval.</p>
                            <div className="flex items-center gap-2">
                                <Input 
                                    readOnly 
                                    value={`${window.location.origin}/register?invite=${successData.invite_token}`} 
                                    className="bg-white font-mono text-xs"
                                />
                                <Button size="icon" variant="outline" onClick={handleCopy}>
                                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-600" />}
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end mt-4">
                        <Button onClick={() => { onClose(); setSuccessData(null); }}>Done</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Onboard New Hospital</DialogTitle>
                    <DialogDescription>
                        Register a new hospital to the network. An admin invite flow will be triggered.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div>
                            <Label>Hospital Name <span className="text-red-500">*</span></Label>
                            <Input 
                                required 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                placeholder="E.g., Korle-Bu Teaching Hospital"
                            />
                        </div>
                        
                        <div>
                            <Label>Street Address <span className="text-red-500">*</span></Label>
                            <Input 
                                required 
                                value={formData.address} 
                                onChange={e => setFormData({...formData, address: e.target.value})} 
                                placeholder="E.g., 1 Guggisberg Ave, Accra"
                            />
                            <p className="text-xs text-gray-500 mt-1">Address will be dynamically geocoded to place the hospital on the map.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Facility Level</Label>
                                <Select value={formData.level} onValueChange={v => setFormData({...formData, level: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="teaching">Teaching Hospital</SelectItem>
                                        <SelectItem value="regional">Regional Hospital</SelectItem>
                                        <SelectItem value="district">District Hospital</SelectItem>
                                        <SelectItem value="polyclinic">Polyclinic</SelectItem>
                                        <SelectItem value="health_centre">Health Centre</SelectItem>
                                        <SelectItem value="chps">CHPS Compound</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Ownership</Label>
                                <Select value={formData.ownership} onValueChange={v => setFormData({...formData, ownership: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">Public / Government</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                        <SelectItem value="faith_based">Faith-based (CHAG)</SelectItem>
                                        <SelectItem value="military">Military / Police</SelectItem>
                                        <SelectItem value="quasi_government">Quasi-Government</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Admin Email (Optional via form)</Label>
                                <Input 
                                    type="email" 
                                    value={formData.admin_email} 
                                    onChange={e => setFormData({...formData, admin_email: e.target.value})} 
                                    placeholder="admin@hospital.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Contact Phone <span className="text-red-500">*</span></Label>
                                <Input 
                                    required 
                                    value={formData.contact_phone} 
                                    onChange={e => setFormData({...formData, contact_phone: e.target.value})} 
                                    placeholder="+233..."
                                />
                            </div>
                            <div>
                                <Label>General Email</Label>
                                <Input 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div className="border bg-slate-50 p-4 rounded-lg space-y-4">
                            <Label className="text-slate-800">Initial Capacity Data</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs">General Beds</Label>
                                    <Input 
                                        type="number" 
                                        min="0"
                                        value={formData.general_beds} 
                                        onChange={e => setFormData({...formData, general_beds: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">ICU Beds</Label>
                                    <Input 
                                        type="number" 
                                        min="0"
                                        value={formData.icu_beds} 
                                        onChange={e => setFormData({...formData, icu_beds: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-secondary">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Create Hospital
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
