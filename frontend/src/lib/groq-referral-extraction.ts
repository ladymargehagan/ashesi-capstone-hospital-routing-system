import { AiReferralStructuredData } from '@/types';

type LooseRecord = Record<string, unknown>;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function isPopulated(value: unknown) {
    if (value === null || value === undefined || value === '') {
        return false;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value as Record<string, unknown>).length > 0;
    }
    return true;
}

function textFieldShouldPreferSecondary(primary: string | null | undefined, secondary: string | null | undefined) {
    if (!secondary) {
        return false;
    }
    if (!primary) {
        return true;
    }

    const normalizedPrimary = primary.trim().toLowerCase();
    const normalizedSecondary = secondary.trim().toLowerCase();

    if (normalizedPrimary === normalizedSecondary) {
        return false;
    }

    return normalizedSecondary.includes(normalizedPrimary) || normalizedSecondary.length > normalizedPrimary.length + 10;
}

function buildSchema() {
    return {
        type: 'object',
        properties: {
            full_name: { type: ['string', 'null'] },
            date_of_birth: { type: ['string', 'null'] },
            sex: { type: ['string', 'null'], enum: ['male', 'female', 'other', null] },
            address: { type: ['string', 'null'] },
            nhis_number: { type: ['string', 'null'] },
            nhis_status: { type: ['string', 'null'], enum: ['Active', 'Expired', 'None', null] },
            contact_number: { type: ['string', 'null'] },
            presenting_complaint: { type: ['string', 'null'] },
            clinical_history: { type: ['string', 'null'] },
            examination_findings: { type: ['string', 'null'] },
            working_diagnosis: { type: ['string', 'null'] },
            investigations_done: { type: ['string', 'null'] },
            treatment_given: { type: ['string', 'null'] },
            reason_for_referral: { type: ['string', 'null'] },
            referral_reason: { type: ['string', 'null'], enum: ['cardiac', 'trauma', 'respiratory', 'stroke', 'obstetric', 'seizure', 'general', null] },
            urgency_level: { type: ['string', 'null'], enum: ['routine', 'urgent', 'emergency', null] },
            severity: { type: ['string', 'null'], enum: ['critical', 'high', 'medium', 'low', null] },
            stability: { type: ['string', 'null'], enum: ['stable', 'unstable', null] },
            known_allergies: { type: ['string', 'null'] },
            pre_existing_conditions: { type: ['string', 'null'] },
            vital_signs: {
                type: ['object', 'null'],
                additionalProperties: false,
                properties: {
                    temperature: { type: ['number', 'null'] },
                    pulse: { type: ['number', 'null'] },
                    respiratory_rate: { type: ['number', 'null'] },
                    blood_pressure_systolic: { type: ['number', 'null'] },
                    blood_pressure_diastolic: { type: ['number', 'null'] },
                    spO2: { type: ['number', 'null'] },
                    gcs: { type: ['number', 'null'] },
                },
                required: [
                    'temperature',
                    'pulse',
                    'respiratory_rate',
                    'blood_pressure_systolic',
                    'blood_pressure_diastolic',
                    'spO2',
                    'gcs',
                ],
            },
        },
        required: [
            'full_name',
            'date_of_birth',
            'sex',
            'address',
            'nhis_number',
            'nhis_status',
            'contact_number',
            'presenting_complaint',
            'clinical_history',
            'examination_findings',
            'working_diagnosis',
            'investigations_done',
            'treatment_given',
            'reason_for_referral',
            'referral_reason',
            'urgency_level',
            'severity',
            'stability',
            'known_allergies',
            'pre_existing_conditions',
            'vital_signs',
        ],
        additionalProperties: false,
    };
}

export async function extractReferralWithGroq({
    transcript,
    patientContext,
    partialForm,
}: {
    transcript: string;
    patientContext?: LooseRecord;
    partialForm?: LooseRecord;
}): Promise<AiReferralStructuredData | null> {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
        return null;
    }

    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'system',
                    content: [
                        'You are a Ghanaian clinical referral extraction assistant.',
                        'Extract structured referral data from the final transcript.',
                        'Do not guess facts that are absent.',
                        'Return null for unknown fields.',
                        'If age is present but date of birth is not explicitly stated, leave date_of_birth null.',
                        'Use medically appropriate terminology.',
                        'Prefer exact patient identity values from the transcript when stated.',
                    ].join(' '),
                },
                {
                    role: 'user',
                    content: JSON.stringify({
                        transcript,
                        patient_context: patientContext ?? null,
                        partial_form: partialForm ?? null,
                    }),
                },
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'referral_extraction',
                    strict: true,
                    schema: buildSchema(),
                },
            },
            temperature: 0.1,
        }),
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`Groq extraction failed with status ${response.status}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
        return null;
    }

    return JSON.parse(content) as AiReferralStructuredData;
}

export function mergeStructuredReferralData(
    primary: AiReferralStructuredData,
    secondary: AiReferralStructuredData | null,
): AiReferralStructuredData {
    if (!secondary) {
        return primary;
    }

    const merged: AiReferralStructuredData = {
        ...primary,
    };

    const opportunisticTextFields: (keyof AiReferralStructuredData)[] = [
        'full_name',
        'presenting_complaint',
        'clinical_history',
        'examination_findings',
        'working_diagnosis',
        'investigations_done',
        'treatment_given',
        'reason_for_referral',
        'known_allergies',
        'pre_existing_conditions',
        'address',
        'contact_number',
        'nhis_number',
    ];

    opportunisticTextFields.forEach((field) => {
        const primaryValue = merged[field];
        const secondaryValue = secondary[field];
        if (typeof primaryValue === 'string' || primaryValue === null || primaryValue === undefined) {
            if (typeof secondaryValue === 'string' || secondaryValue === null || secondaryValue === undefined) {
                if (textFieldShouldPreferSecondary(primaryValue, secondaryValue)) {
                    merged[field] = secondaryValue as never;
                }
            }
        }
    });

    const fillIfMissingFields: (keyof AiReferralStructuredData)[] = [
        'date_of_birth',
        'sex',
        'nhis_status',
        'referral_reason',
        'urgency_level',
        'severity',
        'stability',
    ];

    fillIfMissingFields.forEach((field) => {
        if (!isPopulated(merged[field]) && isPopulated(secondary[field])) {
            merged[field] = secondary[field] as never;
        }
    });

    merged.vital_signs = {
        ...(secondary.vital_signs || {}),
        ...(primary.vital_signs || {}),
    };

    if (!Object.keys(merged.vital_signs || {}).length) {
        merged.vital_signs = null;
    }

    return merged;
}
