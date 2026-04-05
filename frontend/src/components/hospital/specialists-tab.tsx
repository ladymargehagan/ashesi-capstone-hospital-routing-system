'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Specialist } from '@/types';
import { specialistsApi } from '@/lib/api-client';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { useAuth } from '@/hooks/use-auth';

const SPECIALTY_OPTIONS = [
    'Cardiology',
    'Trauma Surgery',
    'Neurology',
    'Obstetrics & Gynaecology',
    'Paediatrics',
    'General Surgery',
    'Orthopaedics',
    'Internal Medicine',
    'Anaesthesia',
    'Radiology',
    'Emergency Medicine',
    'Pulmonology',
    'Nephrology',
    'Psychiatry',
];

interface SpecialistsTabProps {
    specialists: Specialist[];
    onSpecialistUpdated?: () => void;
}

export function SpecialistsTab({ specialists, onSpecialistUpdated }: SpecialistsTabProps) {
    const { user } = useAuth();
    const toast = useToast();
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [newSpecialty, setNewSpecialty] = useState('');
    const [newName, setNewName] = useState('');

    const getInitials = (name?: string) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleToggleAvailability = async (specialist: Specialist) => {
        setTogglingId(specialist.id);
        try {
            await specialistsApi.update(specialist.id, {
                on_call_available: !specialist.on_call_available,
            });
            onSpecialistUpdated?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to toggle availability');
        } finally {
            setTogglingId(null);
        }
    };

    const handleAdd = async () => {
        if (!newSpecialty || !user?.hospital_id) return;
        setAdding(true);
        try {
            await specialistsApi.create({
                hospital_id: parseInt(user.hospital_id),
                specialty: newSpecialty,
                specialist_name: newName || undefined,
                on_call_available: false,
            });
            toast.success('Specialist added');
            setNewSpecialty('');
            setNewName('');
            onSpecialistUpdated?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add specialist');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (specialist: Specialist) => {
        setDeletingId(specialist.id);
        try {
            await specialistsApi.delete(specialist.id);
            toast.success('Specialist removed');
            onSpecialistUpdated?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to remove specialist');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Specialists ({specialists.length})</CardTitle>
                    <CardDescription>Toggle on-call availability. The routing algorithm uses this to determine hospital capability.</CardDescription>
                </CardHeader>
                <CardContent>
                    {specialists.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No specialists registered yet. Add one below.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {specialists.map((specialist) => (
                                <div
                                    key={specialist.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 text-secondary">
                                                {getInitials(specialist.specialist_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{specialist.specialist_name || 'Unnamed'}</p>
                                            <p className="text-sm text-gray-500">{specialist.specialty}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleToggleAvailability(specialist)}
                                            disabled={togglingId === specialist.id}
                                            className={
                                                togglingId === specialist.id
                                                    ? 'border-gray-200 text-gray-500'
                                                    : specialist.on_call_available
                                                        ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                                                        : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }
                                        >
                                            {togglingId === specialist.id ? (
                                                <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Updating...</>
                                            ) : (
                                                specialist.on_call_available ? 'On Call' : 'Off Call'
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(specialist)}
                                            disabled={deletingId === specialist.id}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            {deletingId === specialist.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Add Specialist</CardTitle>
                    <CardDescription>Register a new specialist capability for your hospital</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2 flex-1 min-w-[200px]">
                            <Label>Specialty <span className="text-red-500">*</span></Label>
                            <Select value={newSpecialty} onValueChange={setNewSpecialty}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select specialty" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SPECIALTY_OPTIONS.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex-1 min-w-[200px]">
                            <Label>Specialist Name (optional)</Label>
                            <Input
                                placeholder="e.g. Dr. Mensah"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleAdd}
                            disabled={!newSpecialty || adding}
                            className="bg-primary hover:bg-secondary"
                        >
                            {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Add Specialist
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
