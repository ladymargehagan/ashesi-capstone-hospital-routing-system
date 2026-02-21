'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { HospitalRecommendation } from '@/types';
import { TrendingUp, MapPin, Clock, Bed, Heart, Users, CheckCircle } from 'lucide-react';

interface RecommendationsModalProps {
    open: boolean;
    onClose: () => void;
    recommendations: HospitalRecommendation[];
    onSelect: (recommendation: HospitalRecommendation) => void;
}

export function RecommendationsModal({ open, onClose, recommendations, onSelect }: RecommendationsModalProps) {
    const getFreshnessStyle = (freshness?: string) => {
        if (freshness === 'Fresh') return 'bg-green-100 text-green-700 border-green-200';
        return 'bg-amber-100 text-amber-700 border-amber-200';
    };

    const getMatchColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-amber-600';
        return 'text-gray-600';
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Algorithm Recommendations
                    </DialogTitle>
                    <DialogDescription>
                        Top {recommendations.length} hospitals based on capacity, distance, and specialty match
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-4">
                    {recommendations.map((rec, index) => (
                        <Card
                            key={rec.hospital.id}
                            className="hover:border-blue-300 cursor-pointer transition-colors"
                            onClick={() => onSelect(rec)}
                        >
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{rec.hospital.name}</h4>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <MapPin className="h-3 w-3" />
                                                <span>{rec.hospital.address}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-2xl font-bold ${getMatchColor(rec.match_score)}`}>
                                            {rec.match_score}%
                                        </p>
                                        <p className="text-xs text-gray-500">Match Score</p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <Bed className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="text-gray-600">Beds: <strong>{rec.available_beds}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <MapPin className="h-3.5 w-3.5 text-red-500" />
                                        <span className="text-gray-600"><strong>{rec.distance_km}</strong> km</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-gray-600">{rec.estimated_wait}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <Users className="h-3.5 w-3.5 text-purple-500" />
                                        <span className="text-gray-600">Specialists: <strong>{rec.available_specialists}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                        <span className="text-gray-600">Accept: <strong>{rec.acceptance_rate}%</strong></span>
                                    </div>
                                </div>

                                {/* Bottom Row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge className={`text-xs ${getFreshnessStyle(rec.data_freshness)}`} variant="outline">
                                            Data: {rec.data_freshness || 'Unknown'}
                                        </Badge>
                                        <Badge className="text-xs bg-gray-100 text-gray-600" variant="outline">
                                            {rec.hospital.tier.replace('_', ' ').toUpperCase()} • {rec.hospital.type}
                                        </Badge>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => onSelect(rec)}>
                                        Select
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
