'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HospitalRecommendation } from '@/types';
import { MapPin, Clock, Star, Bed, Users } from 'lucide-react';

interface RecommendationsModalProps {
    open: boolean;
    onClose: () => void;
    recommendations: HospitalRecommendation[];
    onSelect: (recommendation: HospitalRecommendation) => void;
}

export function RecommendationsModal({
    open,
    onClose,
    recommendations,
    onSelect
}: RecommendationsModalProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Hospital Recommendations</DialogTitle>
                    <DialogDescription>
                        Algorithm-powered matching based on patient condition, hospital resources, and distance
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {recommendations.map((rec, index) => (
                        <div
                            key={rec.hospital.id}
                            className={`p-4 rounded-lg border-2 ${index === 0
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-white'
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{rec.hospital.name}</h3>
                                        {index === 0 && (
                                            <Badge className="bg-blue-600 text-white text-xs">Best Match</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {rec.distance_km} miles away
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {rec.estimated_wait}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-blue-600">
                                        <Star className="h-4 w-4 fill-current" />
                                        <span className="font-bold text-lg">{rec.match_score}%</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Match Score</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Available Beds</p>
                                    <p className="font-semibold flex items-center gap-1">
                                        <Bed className="h-4 w-4 text-gray-400" />
                                        {rec.available_beds}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Acceptance Rate</p>
                                    <p className="font-semibold">{rec.acceptance_rate}%</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Specialists</p>
                                    <p className="font-semibold flex items-center gap-1">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        {rec.available_specialists}
                                    </p>
                                </div>
                            </div>

                            {/* Data Freshness */}
                            <div className="mb-3">
                                <Badge
                                    variant="outline"
                                    className={
                                        rec.data_freshness === 'Fresh'
                                            ? 'text-green-600 border-green-200'
                                            : rec.data_freshness === 'Stale'
                                                ? 'text-amber-600 border-amber-200'
                                                : 'text-red-600 border-red-200'
                                    }
                                >
                                    Data: {rec.data_freshness}
                                </Badge>
                            </div>

                            {/* Select Button */}
                            <Button
                                className="w-full"
                                variant={index === 0 ? 'default' : 'outline'}
                                onClick={() => onSelect(rec)}
                            >
                                Select {rec.hospital.name}
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
