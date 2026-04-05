import { NextRequest, NextResponse } from 'next/server';

const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com';
const MAX_POLL_ATTEMPTS = 40;
const POLL_DELAY_MS = 1500;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
    if (!apiKey) {
        return NextResponse.json({ detail: 'ASSEMBLYAI_API_KEY is not configured on the frontend server.' }, { status: 500 });
    }

    const formData = await request.formData().catch(() => null);
    const audioFile = formData?.get('audio');

    if (!(audioFile instanceof File)) {
        return NextResponse.json({ detail: 'Audio file is required.' }, { status: 400 });
    }

    const uploadResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/v2/upload`, {
        method: 'POST',
        headers: {
            authorization: apiKey,
            'content-type': 'application/octet-stream',
        },
        body: Buffer.from(await audioFile.arrayBuffer()),
        cache: 'no-store',
    });

    if (!uploadResponse.ok) {
        const detail = await uploadResponse.text();
        return NextResponse.json({ detail: `Failed to upload audio to AssemblyAI: ${detail || uploadResponse.statusText}` }, { status: 500 });
    }

    const uploadPayload = await uploadResponse.json();
    const transcriptResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/v2/transcript`, {
        method: 'POST',
        headers: {
            authorization: apiKey,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            audio_url: uploadPayload.upload_url,
            language_detection: true,
            speech_models: ['universal-3-pro', 'universal-2'],
        }),
        cache: 'no-store',
    });

    if (!transcriptResponse.ok) {
        const detail = await transcriptResponse.text();
        return NextResponse.json({ detail: `Failed to queue AssemblyAI transcript: ${detail || transcriptResponse.statusText}` }, { status: 500 });
    }

    const transcriptPayload = await transcriptResponse.json();
    const transcriptId = transcriptPayload.id as string | undefined;

    if (!transcriptId) {
        return NextResponse.json({ detail: 'AssemblyAI did not return a transcript id.' }, { status: 500 });
    }

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
        const pollingResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/v2/transcript/${transcriptId}`, {
            headers: {
                authorization: apiKey,
            },
            cache: 'no-store',
        });

        if (!pollingResponse.ok) {
            const detail = await pollingResponse.text();
            return NextResponse.json({ detail: `Failed to poll AssemblyAI transcript: ${detail || pollingResponse.statusText}` }, { status: 500 });
        }

        const result = await pollingResponse.json();
        if (result.status === 'completed') {
            return NextResponse.json({
                transcript: typeof result.text === 'string' ? result.text.trim() : '',
                transcript_id: transcriptId,
                status: result.status,
            });
        }

        if (result.status === 'error') {
            return NextResponse.json({ detail: `AssemblyAI transcription failed: ${result.error || 'Unknown error'}` }, { status: 500 });
        }

        await sleep(POLL_DELAY_MS);
    }

    return NextResponse.json({ detail: 'AssemblyAI transcription timed out before completion.' }, { status: 504 });
}
