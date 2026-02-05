'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Resource } from '@/types';

interface ResourceUpdateModalProps {
    resource: Resource | null;
    open: boolean;
    onClose: () => void;
}

export function ResourceUpdateModal({ resource, open, onClose }: ResourceUpdateModalProps) {
    const [available, setAvailable] = useState(0);
    const [reserved, setReserved] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (resource) {
            setAvailable(resource.available);
            setReserved(resource.reserved);
        }
    }, [resource]);

    if (!resource) return null;

    const occupied = resource.total - available - reserved;

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert('Resource updated successfully!');
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Update {resource.type}</DialogTitle>
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
                            value={resource.total}
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
                            value={available}
                            onChange={(e) => setAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                            min={0}
                            max={resource.total - reserved}
                        />
                    </div>

                    {/* Reserved */}
                    <div className="space-y-2">
                        <Label htmlFor="reserved">Reserved</Label>
                        <Input
                            id="reserved"
                            type="number"
                            value={reserved}
                            onChange={(e) => setReserved(Math.max(0, parseInt(e.target.value) || 0))}
                            min={0}
                            max={resource.total - available}
                        />
                    </div>

                    {/* Occupied (calculated) */}
                    <div>
                        <p className="text-sm text-blue-600">Occupied: {Math.max(0, occupied)}</p>
                    </div>

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
