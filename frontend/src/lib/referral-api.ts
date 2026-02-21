/**
 * Client for the HRS Referral Engine API.
 *
 * Calls the FastAPI backend (Backend/api.py) which wraps referral_engine.py
 * without modifying it.
 */

import { EngineResponse, EmergencyType, ReferralSeverity, ReferralStability } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_ENGINE_API_URL || 'http://127.0.0.1:8000';

export interface RecommendRequest {
    lat: number;
    lon: number;
    emergency_type: EmergencyType;
    severity: ReferralSeverity;
    stability: ReferralStability;
}

/**
 * Call the referral engine to get ranked hospital recommendations.
 *
 * The engine performs: Filter → Score → Rank (see the-algorithm.md).
 * This function is a pass-through — the algorithm logic lives entirely
 * in referral_engine.py on the backend.
 */
export async function getRecommendations(params: RecommendRequest): Promise<EngineResponse> {
    const response = await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `Engine API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Check if the engine API is reachable.
 */
export async function checkEngineHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
        return res.ok;
    } catch {
        return false;
    }
}
