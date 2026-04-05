import { NextRequest, NextResponse } from 'next/server';

const ASSEMBLYAI_TOKEN_URL = 'https://streaming.assemblyai.com/v3/token';
const ASSEMBLYAI_STREAM_URL = 'wss://streaming.assemblyai.com/v3/ws';

function getStreamingDefaults() {
    return {
        sample_rate: Number(process.env.ASSEMBLYAI_REALTIME_SAMPLE_RATE || '16000'),
        speech_model: process.env.ASSEMBLYAI_SPEECH_MODEL || 'u3-rt-pro',
        domain: process.env.ASSEMBLYAI_DOMAIN || 'medical-v1',
        format_turns: (process.env.ASSEMBLYAI_FORMAT_TURNS || 'true').toLowerCase() === 'true',
        min_turn_silence: Number(process.env.ASSEMBLYAI_MIN_TURN_SILENCE || '100'),
        max_turn_silence: Number(process.env.ASSEMBLYAI_MAX_TURN_SILENCE || '1000'),
        vad_threshold: Number(process.env.ASSEMBLYAI_VAD_THRESHOLD || '0.3'),
        prompt: process.env.ASSEMBLYAI_PROMPT || 'This is a Ghanaian healthcare referral environment. Expect Ghanaian names, hospital names, locations, and urgent clinical dictation. Prefer medical accuracy.',
    };
}

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
    if (!apiKey) {
        return NextResponse.json({ detail: 'ASSEMBLYAI_API_KEY is not configured on the frontend server.' }, { status: 500 });
    }

    const payload = await request.json().catch(() => ({}));
    const expiresInSeconds = Math.max(1, Math.min(Number(payload.expires_in_seconds || 300), 600));
    const maxSessionDurationSeconds = Math.max(60, Math.min(Number(payload.max_session_duration_seconds || 900), 10800));

    const url = new URL(ASSEMBLYAI_TOKEN_URL);
    url.searchParams.set('expires_in_seconds', String(expiresInSeconds));
    url.searchParams.set('max_session_duration_seconds', String(maxSessionDurationSeconds));

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: apiKey,
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        const detail = await response.text();
        return NextResponse.json({ detail: `Failed to create AssemblyAI session: ${detail || response.statusText}` }, { status: 500 });
    }

    const result = await response.json();

    return NextResponse.json({
        token: result.token,
        expires_in_seconds: result.expires_in_seconds ?? expiresInSeconds,
        websocket_url: ASSEMBLYAI_STREAM_URL,
        streaming_defaults: getStreamingDefaults(),
    });
}
