'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast-provider';
import {
    AI_REFERRAL_DRAFT_STORAGE_KEY,
    StoredAiReferralDraft,
    useAiReferralIntake,
} from '@/hooks/use-ai-referral-intake';
import { AlertTriangle, ArrowRight, Loader2, Mic, MicOff, Sparkles, Wand2 } from 'lucide-react';

interface VoiceReferralCardProps {
    targetHref?: string;
    autoOpen?: boolean;
    patientContext?: Record<string, unknown>;
    partialForm?: Record<string, unknown>;
    onDraftReady?: (draft: StoredAiReferralDraft) => void;
    autoApplyOnReady?: boolean;
    className?: string;
}

export function VoiceReferralCard({
    targetHref,
    autoOpen = false,
    patientContext,
    partialForm,
    onDraftReady,
    autoApplyOnReady = false,
    className,
}: VoiceReferralCardProps) {
    const router = useRouter();
    const toast = useToast();
    const [open, setOpen] = useState(autoOpen);
    const [manualText, setManualText] = useState('');
    const autoAppliedSignatureRef = useRef<string | null>(null);

    const {
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
    } = useAiReferralIntake({ patientContext, partialForm });

    useEffect(() => {
        setOpen(autoOpen);
    }, [autoOpen]);

    useEffect(() => {
        if (!autoApplyOnReady || !onDraftReady || !structured || isRecording || isConnecting || isStructuring) {
            return;
        }

        const signature = JSON.stringify({
            transcript,
            normalized: structured.normalized_transcript,
        });

        if (autoAppliedSignatureRef.current === signature) {
            return;
        }

        autoAppliedSignatureRef.current = signature;
        const draft = persistDraft();
        onDraftReady(draft);
        toast.success('Voice draft applied to the referral form.');
    }, [
        autoApplyOnReady,
        isConnecting,
        isRecording,
        isStructuring,
        onDraftReady,
        persistDraft,
        structured,
        toast,
        transcript,
    ]);

    const extractedCount = useMemo(() => structured?.meta.detected_fields.length || 0, [structured]);

    const handleApply = async () => {
        if (isRecording || isConnecting) {
            toast.warning('Stop voice mode first so the final referral draft can be processed.');
            return;
        }

        const cleanTranscript = transcript.trim();
        let resolvedStructured = structured;

        if (!resolvedStructured && cleanTranscript) {
            resolvedStructured = await structureManualText(cleanTranscript);
        }

        if (!resolvedStructured && cleanTranscript) {
            toast.error('The referral draft is still processing. Wait for extraction to finish, then continue.');
            return;
        }

        const draft = persistDraft({
            transcript: cleanTranscript,
            structured: resolvedStructured,
        });
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(AI_REFERRAL_DRAFT_STORAGE_KEY, JSON.stringify(draft));
        }

        if (onDraftReady) {
            onDraftReady(draft);
            toast.success('Voice draft applied to the referral form.');
            return;
        }

        if (targetHref) {
            router.push(targetHref);
        }
    };

    const handleStructureManual = async () => {
        if (!manualText.trim()) {
            toast.warning('Paste or type a clinical note first.');
            return;
        }

        const response = await structureManualText(manualText);
        if (response) {
            toast.success('Clinical note structured successfully.');
        }
    };

    return (
        <Card className={className}>
            <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Emergency</Badge>
                            <Badge variant="outline" className="border-primary/30 text-secondary">Voice Mode</Badge>
                        </div>
                        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                            <Mic className="h-5 w-5 text-red-600" />
                            Capture referral data faster with live voice intake
                        </CardTitle>
                        <CardDescription className="max-w-2xl text-sm">
                            In an emergency, use voice mode to capture the case live. The transcript streams while you speak, then the final referral fields are generated only after you stop recording so patient details stay stable.
                        </CardDescription>
                    </div>

                    <Button
                        type="button"
                        variant={open ? 'outline' : 'default'}
                        className={open ? '' : 'bg-red-600 hover:bg-red-700'}
                        onClick={() => setOpen((prev) => !prev)}
                    >
                        {open ? 'Hide Voice Intake' : 'Open Voice Intake'}
                    </Button>
                </div>
            </CardHeader>

            {open && (
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                            type="button"
                            className="bg-red-600 hover:bg-red-700 sm:min-w-40"
                            onClick={() => void (isRecording ? stopRecording() : startRecording())}
                            disabled={isConnecting}
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : isRecording ? (
                                <>
                                    <MicOff className="mr-2 h-4 w-4" />
                                    Stop And Process
                                </>
                            ) : (
                                <>
                                    <Mic className="mr-2 h-4 w-4" />
                                    Start Voice Mode
                                </>
                            )}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => void reset()}>
                            Reset Draft
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => void handleApply()}
                            disabled={(!structured && !transcript) || isConnecting || isRecording || isStructuring}
                        >
                            {onDraftReady ? 'Apply to Form' : 'Continue to Referral Form'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-3">
                            <div className="rounded-xl border bg-slate-950 p-4 text-slate-50">
                                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-300">
                                    <span>Live Transcript</span>
                                    {isStructuring && (
                                        <span className="inline-flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Processing final audio
                                        </span>
                                    )}
                                </div>
                                <p className="min-h-28 whitespace-pre-wrap text-sm leading-6 text-slate-100">
                                    {transcript || 'Press "Start Voice Mode" and speak naturally. You will see live transcript feedback here, but the final referral extraction waits until you stop recording.'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                    <Wand2 className="h-4 w-4 text-primary" />
                                    Typed note fallback
                                </div>
                                <Textarea
                                    value={manualText}
                                    onChange={(event) => setManualText(event.target.value)}
                                    rows={5}
                                    placeholder="Paste or type a clinical note here if voice mode is unavailable."
                                />
                                <Button type="button" variant="outline" onClick={() => void handleStructureManual()}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Structure Typed Note
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-xl border bg-white p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900">Extraction Summary</h3>
                                    <Badge variant="outline">{extractedCount} fields</Badge>
                                </div>

                                {structured ? (
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {structured.meta.detected_fields.slice(0, 10).map((field) => (
                                                <Badge key={field} className="bg-primary/10 text-secondary hover:bg-primary/10">
                                                    {field.replace(/_/g, ' ')}
                                                </Badge>
                                            ))}
                                        </div>

                                        {structured.warnings.length > 0 && (
                                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                                <p className="font-medium">Review before submit</p>
                                                <ul className="mt-1 space-y-1">
                                                    {structured.warnings.slice(0, 4).map((warning) => (
                                                        <li key={warning}>{warning}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="space-y-1 text-sm text-gray-700">
                                            <p><span className="font-medium">Complaint:</span> {structured.structured_data.presenting_complaint || 'Not extracted yet'}</p>
                                            <p><span className="font-medium">Diagnosis:</span> {structured.structured_data.working_diagnosis || 'Not extracted yet'}</p>
                                            <p><span className="font-medium">Referral reason:</span> {structured.structured_data.referral_reason || 'Not extracted yet'}</p>
                                            <p><span className="font-medium">Stability:</span> {structured.structured_data.stability || 'Needs review'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Structured referral data will appear here after the recording is stopped and the completed audio is processed.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
