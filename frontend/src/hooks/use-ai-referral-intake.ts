'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { aiReferralsApi } from '@/lib/api-client';
import { AiReferralStructureResponse } from '@/types';

export const AI_REFERRAL_DRAFT_STORAGE_KEY = 'hrs-ai-referral-draft';

const TARGET_SAMPLE_RATE = 16000;

type Dict = Record<string, unknown>;

function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number) {
    if (outputSampleRate >= inputSampleRate) {
        return buffer;
    }

    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        let accum = 0;
        let count = 0;

        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
            accum += buffer[i];
            count += 1;
        }

        result[offsetResult] = accum / Math.max(count, 1);
        offsetResult += 1;
        offsetBuffer = nextOffsetBuffer;
    }

    return result;
}

function floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
        const sample = Math.max(-1, Math.min(1, input[i]));
        output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return output;
}

function sanitizeDraftText(text: string) {
    return text.replace(/\s+/g, ' ').trim();
}

function buildTranscript(finalizedTurns: string[], interimTurn: string) {
    return sanitizeDraftText([...finalizedTurns, interimTurn].filter(Boolean).join(' '));
}

function pickRecordingMimeType() {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
        return undefined;
    }

    const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
    ];

    return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
}

export interface StoredAiReferralDraft {
    transcript: string;
    structured: AiReferralStructureResponse | null;
    saved_at: string;
}

interface UseAiReferralIntakeOptions {
    patientContext?: Dict;
    partialForm?: Dict;
}

export function readStoredAiReferralDraft(): StoredAiReferralDraft | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const raw = window.sessionStorage.getItem(AI_REFERRAL_DRAFT_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as StoredAiReferralDraft;
    } catch {
        return null;
    }
}

export function clearStoredAiReferralDraft() {
    if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(AI_REFERRAL_DRAFT_STORAGE_KEY);
    }
}

export function useAiReferralIntake(options: UseAiReferralIntakeOptions = {}) {
    const [transcript, setTranscript] = useState('');
    const [structured, setStructured] = useState<AiReferralStructureResponse | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isStructuring, setIsStructuring] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const currentTranscriptRef = useRef('');
    const finalizedTurnsRef = useRef<string[]>([]);
    const interimTurnRef = useRef('');
    const patientContextRef = useRef<Dict | undefined>(options.patientContext);
    const partialFormRef = useRef<Dict | undefined>(options.partialForm);

    useEffect(() => {
        patientContextRef.current = options.patientContext;
    }, [options.patientContext]);

    useEffect(() => {
        partialFormRef.current = options.partialForm;
    }, [options.partialForm]);

    const cleanupAudio = useCallback(async () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            await audioContextRef.current.close().catch(() => undefined);
            audioContextRef.current = null;
        }
    }, []);

    const closeWebSocket = useCallback(() => {
        if (!wsRef.current) {
            return;
        }

        try {
            if (wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'Terminate' }));
            }
            wsRef.current.close();
        } catch {
            // ignore close errors
        }

        wsRef.current = null;
    }, []);

    const runStructure = useCallback(async (text: string) => {
        const cleanText = sanitizeDraftText(text);
        if (cleanText.length < 8) {
            return null;
        }

        setIsStructuring(true);

        try {
            const response = await aiReferralsApi.structureTranscript({
                transcript: cleanText,
                patient_context: patientContextRef.current,
                partial_form: partialFormRef.current,
            });
            setStructured(response);
            return response;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to structure referral transcript.');
            return null;
        } finally {
            setIsStructuring(false);
        }
    }, []);

    const stopMediaRecorder = useCallback(async () => {
        const recorder = mediaRecorderRef.current;
        if (!recorder) {
            return null;
        }

        mediaRecorderRef.current = null;

        return new Promise<Blob | null>((resolve) => {
            recorder.onstop = () => {
                const mimeType = recorder.mimeType || 'audio/webm';
                const blob = recordedChunksRef.current.length
                    ? new Blob(recordedChunksRef.current, { type: mimeType })
                    : null;
                resolve(blob);
            };

            if (recorder.state === 'inactive') {
                recorder.onstop?.(new Event('stop'));
                return;
            }

            recorder.stop();
        });
    }, []);

    const stopRecording = useCallback(async () => {
        setIsConnecting(false);
        setIsRecording(false);
        setError(null);

        const recordedBlob = await stopMediaRecorder();
        closeWebSocket();
        await cleanupAudio();

        let finalTranscript = buildTranscript(finalizedTurnsRef.current, interimTurnRef.current);

        if (recordedBlob && recordedBlob.size > 0) {
            setIsStructuring(true);
            try {
                const transcription = await aiReferralsApi.transcribeAudio(recordedBlob);
                if (transcription.transcript.trim()) {
                    finalTranscript = sanitizeDraftText(transcription.transcript);
                    finalizedTurnsRef.current = finalTranscript ? [finalTranscript] : [];
                    interimTurnRef.current = '';
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Final transcription failed. Using the live transcript instead.');
            } finally {
                setIsStructuring(false);
            }
        }

        currentTranscriptRef.current = finalTranscript;
        setTranscript(finalTranscript);

        if (finalTranscript) {
            await runStructure(finalTranscript);
        }
    }, [cleanupAudio, closeWebSocket, runStructure, stopMediaRecorder]);

    const startRecording = useCallback(async () => {
        if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setError('Voice mode is not supported in this browser.');
            return;
        }

        setError(null);
        setStructured(null);
        setTranscript('');
        currentTranscriptRef.current = '';
        finalizedTurnsRef.current = [];
        interimTurnRef.current = '';
        recordedChunksRef.current = [];
        setIsConnecting(true);

        try {
            const session = await aiReferralsApi.createSession({
                expires_in_seconds: 300,
                max_session_duration_seconds: 900,
            });

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            const audioContext = new window.AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            const recordingMimeType = pickRecordingMimeType();
            const recorder = new MediaRecorder(
                stream,
                recordingMimeType ? { mimeType: recordingMimeType } : undefined,
            );

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            recorder.start();
            mediaRecorderRef.current = recorder;

            const params = new URLSearchParams({
                sample_rate: String(session.streaming_defaults.sample_rate || TARGET_SAMPLE_RATE),
                speech_model: session.streaming_defaults.speech_model,
                token: session.token,
            });

            if (session.streaming_defaults.format_turns !== undefined) {
                params.set('format_turns', String(session.streaming_defaults.format_turns));
            }
            if (session.streaming_defaults.domain) {
                params.set('domain', session.streaming_defaults.domain);
            }
            if (session.streaming_defaults.min_turn_silence !== undefined) {
                params.set('min_turn_silence', String(session.streaming_defaults.min_turn_silence));
            }
            if (session.streaming_defaults.max_turn_silence !== undefined) {
                params.set('max_turn_silence', String(session.streaming_defaults.max_turn_silence));
            }
            if (session.streaming_defaults.vad_threshold !== undefined) {
                params.set('vad_threshold', String(session.streaming_defaults.vad_threshold));
            }
            if (session.streaming_defaults.prompt) {
                params.set('prompt', session.streaming_defaults.prompt);
            }

            const socket = new WebSocket(`${session.websocket_url}?${params.toString()}`);
            wsRef.current = socket;
            streamRef.current = stream;
            sourceRef.current = source;
            processorRef.current = processor;
            audioContextRef.current = audioContext;

            socket.onopen = () => {
                setIsConnecting(false);
                setIsRecording(true);

                processor.onaudioprocess = (event) => {
                    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                        return;
                    }

                    const input = event.inputBuffer.getChannelData(0);
                    const downsampled = downsampleBuffer(input, audioContext.sampleRate, TARGET_SAMPLE_RATE);
                    const pcm = floatTo16BitPCM(downsampled);
                    wsRef.current.send(pcm.buffer);
                };

                source.connect(processor);
                processor.connect(audioContext.destination);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type !== 'Turn' || typeof data.transcript !== 'string' || !data.transcript.trim()) {
                        return;
                    }

                    const cleanedTurn = sanitizeDraftText(data.transcript);
                    if (data.turn_is_formatted) {
                        const lastFinalTurn = finalizedTurnsRef.current[finalizedTurnsRef.current.length - 1];
                        if (lastFinalTurn !== cleanedTurn) {
                            finalizedTurnsRef.current = [...finalizedTurnsRef.current, cleanedTurn];
                        }
                        interimTurnRef.current = '';
                    } else {
                        interimTurnRef.current = cleanedTurn;
                    }

                    const nextTranscript = buildTranscript(finalizedTurnsRef.current, interimTurnRef.current);
                    currentTranscriptRef.current = nextTranscript;
                    setTranscript(nextTranscript);
                } catch {
                    // ignore malformed websocket messages
                }
            };

            socket.onerror = () => {
                setError('AssemblyAI streaming connection failed.');
                void stopRecording();
            };

            socket.onclose = () => {
                setIsConnecting(false);
                setIsRecording(false);
            };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to start voice mode.');
            setIsConnecting(false);
            setIsRecording(false);
            await stopMediaRecorder();
            await cleanupAudio();
        }
    }, [cleanupAudio, stopMediaRecorder, stopRecording]);

    const reset = useCallback(async () => {
        closeWebSocket();
        await stopMediaRecorder();
        await cleanupAudio();
        recordedChunksRef.current = [];
        finalizedTurnsRef.current = [];
        interimTurnRef.current = '';
        currentTranscriptRef.current = '';
        setTranscript('');
        setStructured(null);
        setIsConnecting(false);
        setIsRecording(false);
        setIsStructuring(false);
        setError(null);
    }, [cleanupAudio, closeWebSocket, stopMediaRecorder]);

    const structureManualText = useCallback(async (text: string) => {
        const cleanText = sanitizeDraftText(text);
        currentTranscriptRef.current = cleanText;
        finalizedTurnsRef.current = cleanText ? [cleanText] : [];
        interimTurnRef.current = '';
        setTranscript(cleanText);
        return runStructure(cleanText);
    }, [runStructure]);

    const persistDraft = useCallback((override?: { transcript?: string; structured?: AiReferralStructureResponse | null }) => {
        const payload: StoredAiReferralDraft = {
            transcript: override?.transcript ?? transcript,
            structured: override?.structured ?? structured,
            saved_at: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(AI_REFERRAL_DRAFT_STORAGE_KEY, JSON.stringify(payload));
        }

        return payload;
    }, [structured, transcript]);

    useEffect(() => () => {
        void cleanupAudio();
        closeWebSocket();
        void stopMediaRecorder();
    }, [cleanupAudio, closeWebSocket, stopMediaRecorder]);

    return {
        transcript,
        structured,
        isConnecting,
        isRecording,
        isStructuring,
        error,
        startRecording,
        stopRecording,
        reset,
        structureManualText,
        persistDraft,
    };
}
