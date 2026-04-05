import { NextRequest, NextResponse } from 'next/server';
import { extractReferralWithGroq, mergeStructuredReferralData } from '@/lib/groq-referral-extraction';
import { structureReferralFromTranscript } from '@/lib/ai-referral-structure';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const payload = await request.json().catch(() => null);
    const transcript = typeof payload?.transcript === 'string' ? payload.transcript.trim() : '';

    if (transcript.length < 3) {
        return NextResponse.json({ detail: 'Transcript is required.' }, { status: 400 });
    }

    const deterministic = structureReferralFromTranscript(
        transcript,
        payload?.patient_context ?? undefined,
        payload?.partial_form ?? undefined,
    );

    try {
        const groqStructured = await extractReferralWithGroq({
            transcript,
            patientContext: payload?.patient_context ?? undefined,
            partialForm: payload?.partial_form ?? undefined,
        });

        if (!groqStructured) {
            return NextResponse.json(deterministic);
        }

        const merged = mergeStructuredReferralData(deterministic.structured_data, groqStructured);
        const detectedFields = Object.entries(merged)
            .filter(([, value]) => value !== null && value !== undefined && value !== '' && !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0))
            .map(([key]) => key)
            .sort();
        const missingFields = ['presenting_complaint', 'working_diagnosis', 'reason_for_referral', 'referral_reason']
            .filter((field) => !merged[field as keyof typeof merged]);

        return NextResponse.json({
            ...deterministic,
            structured_data: merged,
            meta: {
                ...deterministic.meta,
                detected_fields: detectedFields,
                missing_fields: missingFields,
            },
        });
    } catch {
        return NextResponse.json(deterministic);
    }
}
