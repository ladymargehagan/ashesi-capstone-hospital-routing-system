import { NextRequest, NextResponse } from 'next/server';

const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com';

export const runtime = 'nodejs';

/**
 * POST — upload audio and submit a transcription job.
 * Returns {transcript_id, status: "processing"} immediately.
 * The caller is responsible for polling GET until status === "completed".
 */
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

    // 1. Upload audio
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
        return NextResponse.json(
            { detail: `Failed to upload audio to AssemblyAI: ${detail || uploadResponse.statusText}` },
            { status: 500 },
        );
    }

    const { upload_url } = await uploadResponse.json();

    // 2. Submit transcription job
    const transcriptResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/v2/transcript`, {
        method: 'POST',
        headers: {
            authorization: apiKey,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            audio_url: upload_url,
            language_detection: true,
            speech_models: ['universal-2'],
        }),
        cache: 'no-store',
    });

    if (!transcriptResponse.ok) {
        const detail = await transcriptResponse.text();
        return NextResponse.json(
            { detail: `Failed to queue AssemblyAI transcript: ${detail || transcriptResponse.statusText}` },
            { status: 500 },
        );
    }

    const { id: transcript_id } = await transcriptResponse.json();

    if (!transcript_id) {
        return NextResponse.json({ detail: 'AssemblyAI did not return a transcript id.' }, { status: 500 });
    }

    // Return immediately — client polls GET until completed
    return NextResponse.json({ transcript_id, status: 'processing' });
}

/**
 * GET ?id=<transcript_id> — check status of a submitted job once.
 * Returns {status, transcript?} — client polls this until status === "completed".
 */
export async function GET(request: NextRequest) {
    const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
    if (!apiKey) {
        return NextResponse.json({ detail: 'ASSEMBLYAI_API_KEY is not configured on the frontend server.' }, { status: 500 });
    }

    const transcript_id = request.nextUrl.searchParams.get('id');
    if (!transcript_id) {
        return NextResponse.json({ detail: 'transcript id is required (?id=...)' }, { status: 400 });
    }

    const pollingResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/v2/transcript/${transcript_id}`, {
        headers: { authorization: apiKey },
        cache: 'no-store',
    });

    if (!pollingResponse.ok) {
        const detail = await pollingResponse.text();
        return NextResponse.json(
            { detail: `Failed to poll AssemblyAI transcript: ${detail || pollingResponse.statusText}` },
            { status: 500 },
        );
    }

    const result = await pollingResponse.json();

    if (result.status === 'completed') {
        return NextResponse.json({
            status: 'completed',
            transcript: typeof result.text === 'string' ? result.text.trim() : '',
            transcript_id,
        });
    }

    if (result.status === 'error') {
        return NextResponse.json(
            { detail: `AssemblyAI transcription failed: ${result.error || 'Unknown error'}` },
            { status: 500 },
        );
    }

    // Still processing
    return NextResponse.json({ status: result.status, transcript_id });
}
