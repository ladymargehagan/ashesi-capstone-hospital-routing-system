'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Resource } from '@/types';
import { getResourceDisplayName, resourcesApi } from '@/lib/api-client';

interface ResourceUpdateModalProps {
    resource: Resource | null;
    open: boolean;
    onClose: () => void;
    onSaved?: () => void;
}

export function ResourceUpdateModal({ resource, open, onClose, onSaved }: ResourceUpdateModalProps) {
    const [availableCount, setAvailableCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (resource) {
            setAvailableCount(resource.available_count || 0);
            setError(null);
        }
    }, [resource]);

    if (!resource) return null;

    const totalCount = resource.total_count || 0;
    const occupied = totalCount - availableCount;

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            await resourcesApi.update(resource.id, {
                available_count: availableCount,
                is_available: availableCount > 0,
            });
            onSaved?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update resource');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Update {getResourceDisplayName(resource.resource_type)}</DialogTitle>
                    <DialogDescription>
                        Update resource availability
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Total Capacity */}
                    <div className="space-y-2">
                        <Label htmlFor="total">Total Capacity</Label>
                        <Input
                            id="total"
                            type="number"
                            value={totalCount}
                            disabled
                            className="bg-gray-100"
                        />
                    </div>

                    {/* Available */}
                    <div className="space-y-2">
                        <Label htmlFor="available">Available</Label>
                        <Input
                            id="available"
                            type="number"
                            value={availableCount}
                            onChange={(e) => setAvailableCount(Math.max(0, parseInt(e.target.value) || 0))}
                            min={0}
                            max={totalCount}
                        />
                    </div>

                    {/* Occupied (calculated) */}
                    <div>
                        <p className="text-sm text-blue-600">Occupied: {Math.max(0, occupied)}</p>
                    </div>

                    {/* Operator Info */}
                    {resource.operator_required && (
                        <div className="p-2 bg-amber-50 rounded-md">
                            <p className="text-xs text-amber-700">
                                Operator required{resource.operator_specialty ? `: ${resource.operator_specialty}` : ''}
                            </p>
                        </div>
                    )}
                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
