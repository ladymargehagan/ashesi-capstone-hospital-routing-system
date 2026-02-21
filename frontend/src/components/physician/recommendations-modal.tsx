'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EngineRecommendation } from '@/types';
import {
    TrendingUp, MapPin, Clock, Shield, Activity,
    CheckCircle, XCircle, AlertTriangle, Phone
} from 'lucide-react';

interface RecommendationsModalProps {
    open: boolean;
    onClose: () => void;
    recommendations: EngineRecommendation[];
    warnings: string[];
    onSelect: (recommendation: EngineRecommendation) => void;
    loading?: boolean;
}

export function RecommendationsModal({
    open, onClose, recommendations, warnings, onSelect, loading
}: RecommendationsModalProps) {

    const getScoreColor = (score: number) => {
        if (score >= 0.7) return 'text-green-600';
        if (score >= 0.4) return 'text-blue-600';
        if (score >= 0.2) return 'text-amber-600';
        return 'text-red-600';
    };

    const getScoreBarColor = (score: number) => {
        if (score >= 0.7) return 'bg-green-500';
        if (score >= 0.4) return 'bg-blue-500';
        if (score >= 0.2) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getFreshnessLabel = (factor: number) => {
        if (factor >= 0.7) return { label: 'Fresh', style: 'bg-green-100 text-green-700 border-green-200' };
        if (factor >= 0.3) return { label: 'Aging', style: 'bg-amber-100 text-amber-700 border-amber-200' };
        return { label: 'Stale', style: 'bg-red-100 text-red-700 border-red-200' };
    };

    const formatResource = (name: string) => name.replace(/_/g, ' ');

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Engine Recommendations
                    </DialogTitle>
                    <DialogDescription>
                        Ranked by composite score (capability × proximity × data freshness)
                    </DialogDescription>
                </DialogHeader>

                {/* Engine Warnings */}
                {warnings.length > 0 && (
                    <div className="space-y-2 mt-2">
                        {warnings.map((warning, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{warning}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Activity className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Running referral engine...</p>
                        </div>
                    </div>
                )}

                {/* No Results */}
                {!loading && recommendations.length === 0 && (
                    <div className="text-center py-12">
                        <XCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No hospitals found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            No hospitals within range meet the requirements for this case.
                        </p>
                    </div>
                )}

                {/* Recommendations List */}
                {!loading && (
                    <div className="space-y-3 mt-4">
                        {recommendations.map((rec) => {
                            const freshness = getFreshnessLabel(rec.freshness_factor);
                            const scorePercent = Math.round(rec.composite_score * 100);

                            return (
                                <Card
                                    key={rec.hospital_id}
                                    className="hover:border-blue-300 cursor-pointer transition-colors"
                                    onClick={() => onSelect(rec)}
                                >
                                    <CardContent className="pt-4 pb-4">
                                        {/* Header: Rank, Name, Score */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${rec.rank === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    #{rec.rank}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{rec.hospital_name}</h4>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                                        <span className="capitalize">{rec.hospital_type}</span>
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {rec.contact}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-2xl font-bold ${getScoreColor(rec.composite_score)}`}>
                                                    {scorePercent}%
                                                </p>
                                                <p className="text-xs text-gray-500">Composite</p>
                                            </div>
                                        </div>

                                        {/* Score Bars */}
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-gray-500 flex items-center gap-1">
                                                        <Shield className="h-3 w-3" /> Capability
                                                    </span>
                                                    <span className="font-medium">{Math.round(rec.resource_score * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${getScoreBarColor(rec.resource_score)}`}
                                                        style={{ width: `${Math.round(rec.resource_score * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-gray-500 flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> Proximity
                                                    </span>
                                                    <span className="font-medium">{Math.round(rec.proximity_score * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${getScoreBarColor(rec.proximity_score)}`}
                                                        style={{ width: `${Math.round(rec.proximity_score * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Row */}
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <MapPin className="h-3.5 w-3.5 text-red-500" />
                                                <span className="text-gray-600"><strong>{rec.distance_km}</strong> km</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                <span className="text-gray-600"><strong>{rec.travel_time_minutes}</strong> min</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Activity className="h-3.5 w-3.5 text-blue-500" />
                                                <span className="text-gray-600">
                                                    Updated <strong>{rec.last_update_hours_ago}h</strong> ago
                                                </span>
                                            </div>
                                        </div>

                                        {/* Resource Availability */}
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {rec.resource_availability.map((ra) => (
                                                <Badge
                                                    key={ra.resource}
                                                    variant="outline"
                                                    className={`text-xs ${ra.available
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                        }`}
                                                >
                                                    {ra.available ? (
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                    )}
                                                    {formatResource(ra.resource)}
                                                    {ra.details.quantity != null && ra.details.quantity > 0 && (
                                                        <span className="ml-1 opacity-70">({ra.details.quantity})</span>
                                                    )}
                                                </Badge>
                                            ))}
                                        </div>

                                        {/* Bottom Row */}
                                        <div className="flex items-center justify-between">
                                            <Badge className={`text-xs ${freshness.style}`} variant="outline">
                                                Data: {freshness.label}
                                            </Badge>
                                            <Button size="sm" variant="outline" onClick={() => onSelect(rec)}>
                                                Select
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
