import {
    AiReferralStructureResponse,
    AiReferralStructuredData,
    ReferralReason,
    ReferralSeverity,
    ReferralStability,
} from '@/types';

const GHANA_CORRECTIONS: Record<string, string> = {
    quabena: 'Kwabena',
    ashiaman: 'Ashaiman',
    'korle boo': 'Korle Bu',
    'komfo anoki': 'Komfo Anokye',
    ugmc: 'University of Ghana Medical Centre',
};

const REFERRAL_REASON_KEYWORDS: Record<ReferralReason, string[]> = {
    cardiac: ['chest pain', 'mi', 'myocardial infarction', 'acute coronary', 'palpitations', 'cardiac'],
    trauma: ['trauma', 'fracture', 'head injury', 'road traffic accident', 'bleeding', 'gunshot', 'stab wound'],
    respiratory: ['shortness of breath', 'difficulty breathing', 'respiratory distress', 'asthma', 'oxygen', 'hypoxia', 'pneumonia'],
    stroke: ['stroke', 'cva', 'hemiparesis', 'facial droop', 'slurred speech'],
    obstetric: ['pregnant', 'pregnancy', 'labour', 'labor', 'postpartum', 'antepartum', 'obstetric', 'eclampsia'],
    seizure: ['seizure', 'convulsion', 'fitting', 'status epilepticus'],
    general: [],
};

const PRE_EXISTING_KEYWORDS = [
    'hypertension',
    'hypertensive',
    'diabetes',
    'diabetic',
    'asthma',
    'sickle cell',
    'heart failure',
    'high cholesterol',
    'hyperlipidemia',
    'hiv',
    'epilepsy',
];

type LooseRecord = Record<string, unknown>;

function normalizeText(text: string) {
    let normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
    Object.entries(GHANA_CORRECTIONS).forEach(([wrong, corrected]) => {
        normalized = normalized.replaceAll(wrong, corrected.toLowerCase());
    });
    return normalized;
}

function titleCaseWords(text: string) {
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
            if (/^[A-Z]{2,}$/.test(word)) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

function prettyText(text?: string | null) {
    if (!text) {
        return text ?? null;
    }

    const cleaned = text.trim().replace(/^[,.;:\s]+|[,.;:\s]+$/g, '');
    if (!cleaned) {
        return null;
    }

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function estimateDateOfBirthFromAge(age: number) {
    if (!Number.isFinite(age) || age <= 0 || age > 120) {
        return null;
    }

    const today = new Date();
    const approximateYear = today.getUTCFullYear() - age;
    return `${approximateYear}-01-01`;
}

function normalizeDateOfBirthCandidate(value: string | null) {
    if (!value) {
        return null;
    }

    const isoLike = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoLike) {
        return `${isoLike[1]}-${isoLike[2]}-${isoLike[3]}`;
    }

    const slashLike = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashLike) {
        return `${slashLike[3]}-${slashLike[2]}-${slashLike[1]}`;
    }

    return null;
}

function extractFullName(rawText: string) {
    const patterns = [
        /patient'?s name is\s+([a-z][a-z' -]+?)(?:,|\.|;|\s+\d{1,3}\s*[- ]?year|\s+(?:male|female)\b)/i,
        /name is\s+([a-z][a-z' -]+?)(?:,|\.|;|\s+\d{1,3}\s*[- ]?year|\s+(?:male|female)\b)/i,
        /this is\s+([a-z][a-z' -]+?)(?:,|\.|;|\s+\d{1,3}\s*[- ]?year|\s+(?:male|female)\b)/i,
    ];

    for (const pattern of patterns) {
        const match = rawText.match(pattern);
        if (!match?.[1]) {
            continue;
        }

        const candidate = match[1]
            .replace(/\b(patient|male|female)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!candidate || candidate.split(' ').length < 2) {
            continue;
        }

        return titleCaseWords(candidate);
    }

    return null;
}

function extractFirst(patterns: RegExp[], text: string) {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (!match) {
            continue;
        }

        const value = match.slice(1).find(Boolean);
        if (value) {
            return prettyText(value);
        }
    }

    return null;
}

function extractVitals(text: string): NonNullable<AiReferralStructuredData['vital_signs']> {
    const vitals: NonNullable<AiReferralStructuredData['vital_signs']> = {};

    const bp = text.match(/(?:blood pressure|bp)\s*(?:is|of)?\s*(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})/i);
    if (bp) {
        vitals.blood_pressure_systolic = Number(bp[1]);
        vitals.blood_pressure_diastolic = Number(bp[2]);
    }

    const pulse = text.match(/(?:heart rate|hr|pulse)\s*(?:is|of)?\s*(\d{2,3})/i);
    if (pulse) {
        vitals.pulse = Number(pulse[1]);
    }

    const respiratoryRate = text.match(/(?:respiratory rate|rr)\s*(?:is|of)?\s*(\d{1,3})/i);
    if (respiratoryRate) {
        vitals.respiratory_rate = Number(respiratoryRate[1]);
    }

    const spo2 = text.match(/(?:spo2|oxygen saturation|saturation|sat(?:s)?)\s*(?:is|of)?\s*(\d{2,3})/i);
    if (spo2) {
        vitals.spO2 = Number(spo2[1]);
    }

    const temperature = text.match(/(?:temperature|temp)\s*(?:is|of)?\s*(\d{2}(?:\.\d)?)/i);
    if (temperature) {
        vitals.temperature = Number(temperature[1]);
    }

    const gcs = text.match(/(?:gcs|glasgow coma scale)\s*(?:is|of)?\s*(\d{1,2})/i);
    if (gcs) {
        vitals.gcs = Number(gcs[1]);
    }

    return vitals;
}

function detectReferralReason(text: string): ReferralReason | null {
    for (const [reason, keywords] of Object.entries(REFERRAL_REASON_KEYWORDS) as [ReferralReason, string[]][]) {
        if (keywords.some((keyword) => text.includes(keyword))) {
            return reason;
        }
    }

    return null;
}

function extractSex(text: string): AiReferralStructuredData['sex'] {
    if (/\bmale\b|\bman\b|\bboy\b/i.test(text)) {
        return 'male';
    }
    if (/\bfemale\b|\bwoman\b|\bgirl\b/i.test(text)) {
        return 'female';
    }
    return null;
}

function extractAge(text: string) {
    const patterns = [
        /\b(\d{1,3})\s*year(?:s)? old\b/i,
        /\b(\d{1,3})[- ]year[- ]old\b/i,
        /\b(?:male|female)\s*,?\s*(\d{1,3})\b/i,
        /\bage\s*(\d{1,3})\b/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return Number(match[1]);
        }
    }

    return null;
}

function extractHistory(text: string) {
    let history = extractFirst([
        /(?:history of|known)\s+(.+?)(?:,|\.|;| on examination| examination reveals| examination shows| he is | she is )/i,
        /(hypertensive|diabetic|asthmatic|epileptic)\b/i,
    ], text);

    const conditions = PRE_EXISTING_KEYWORDS.filter((keyword) => text.includes(keyword));
    if (!conditions.length) {
        return { history, preExisting: null };
    }

    const normalized = Array.from(new Set(conditions.map((condition) => prettyText(condition) || condition))).sort().join(', ');
    history = history || normalized;

    return { history, preExisting: normalized };
}

function extractComplaint(text: string) {
    const explicit = extractFirst([
        /(?:presenting with|complains? of|complaint is|chief complaint is)\s+(.+?)(?:,|\.|;)/i,
        /(?:has|with)\s+(.+?)(?:, suspected|, unstable|, stable|, bp|\.|;)/i,
    ], text);

    if (explicit) {
        return explicit;
    }

    for (const keywords of Object.values(REFERRAL_REASON_KEYWORDS)) {
        const keyword = keywords.find((candidate) => text.includes(candidate));
        if (keyword) {
            return prettyText(keyword);
        }
    }

    return null;
}

function extractReasonForReferral(text: string) {
    return extractFirst([
        /(?:refer(?:ral)? for|needs?)\s+(.+?)(?:,|\.|;)/i,
        /(?:reason for referral is)\s+(.+?)(?:,|\.|;)/i,
        /(?:emergency|urgent|routine)\s+referral(?: for)?\s+(.+?)(?:,|\.|;)/i,
    ], text);
}

function extractTreatment(text: string) {
    return extractFirst([
        /(?:treated with|given|started on)\s+(.+?)(?:,|\.|;)/i,
    ], text);
}

function extractInvestigations(text: string) {
    return extractFirst([
        /\b(?:ecg|ct|mri|x-?ray|ultrasound|investigations?)\b\s*(?:shows?|done|reveals?)?\s+(.+?)(?:,|\.|;)/i,
    ], text);
}

function extractDiagnosis(text: string) {
    return extractFirst([
        /(?:suspected|diagnosis(?: is)?|working diagnosis(?: is)?)\s+(.+?)(?:,|\.|;)/i,
        /(?:we think (?:he|she|the patient) has|likely|probable|possible)\s+(.+?)(?:,|\.|;)/i,
        /(?:impression is)\s+(.+?)(?:,|\.|;)/i,
    ], text);
}

function extractExaminationFindings(text: string) {
    return extractFirst([
        /(?:on examination|examination(?: shows| reveals)?|findings?)[,:]?\s+(.+?)(?:, blood pressure|, bp|, pulse|, heart rate|\.|;)/i,
    ], text);
}

function extractUrgency(text: string): AiReferralStructuredData['urgency_level'] {
    if (text.includes('emergency')) {
        return 'emergency';
    }
    if (text.includes('urgent')) {
        return 'urgent';
    }
    if (text.includes('routine')) {
        return 'routine';
    }
    return null;
}

function extractStability(text: string): ReferralStability | null {
    if (text.includes('unstable')) {
        return 'unstable';
    }
    if (text.includes('stable')) {
        return 'stable';
    }
    return null;
}

function extractSeverity(text: string): ReferralSeverity | null {
    if (['critical', 'life threatening', 'collapse', 'cardiac arrest'].some((keyword) => text.includes(keyword))) {
        return 'critical';
    }
    if (['severe', 'unstable', 'emergency'].some((keyword) => text.includes(keyword))) {
        return 'high';
    }
    if (text.includes('mild')) {
        return 'low';
    }
    return null;
}

function pickRecordValue(record: LooseRecord | undefined, key: string) {
    const value = record?.[key];
    return value === undefined ? null : value;
}

function buildReasonForReferralFallback(
    diagnosis: string | null,
    complaint: string | null,
    urgency: AiReferralStructuredData['urgency_level'],
) {
    const urgencyLabel = urgency ? `${urgency.charAt(0).toUpperCase()}${urgency.slice(1)}` : 'Urgent';
    if (diagnosis) {
        return `${urgencyLabel} referral for suspected ${diagnosis.toLowerCase()}`;
    }
    if (complaint) {
        return `${urgencyLabel} referral for ${complaint.toLowerCase()}`;
    }
    return null;
}

export function structureReferralFromTranscript(
    transcript: string,
    patientContext?: LooseRecord,
    partialForm?: LooseRecord,
): AiReferralStructureResponse {
    const compactTranscript = transcript.replace(/\s+/g, ' ').trim();
    const normalized = normalizeText(transcript);
    const vitals = extractVitals(normalized);
    const { history, preExisting } = extractHistory(normalized);
    const age = extractAge(normalized);
    const extractedName = extractFullName(compactTranscript);
    const extractedDiagnosis = extractDiagnosis(normalized);
    const extractedComplaint = extractComplaint(normalized);
    const extractedUrgency = extractUrgency(normalized);
    const explicitDob = normalizeDateOfBirthCandidate(extractFirst([
        /(?:date of birth|dob|born on)\s+(\d{4}-\d{2}-\d{2})/i,
        /(?:date of birth|dob|born on)\s+(\d{2}\/\d{2}\/\d{4})/i,
    ], compactTranscript));
    const estimatedDob = explicitDob || estimateDateOfBirthFromAge(age || 0);

    const structuredData: AiReferralStructuredData = {
        full_name: (extractedName || (pickRecordValue(patientContext, 'full_name') as string | null)) ?? null,
        date_of_birth: (estimatedDob || (pickRecordValue(patientContext, 'date_of_birth') as string | null)) ?? null,
        sex: extractSex(normalized),
        address: (pickRecordValue(patientContext, 'address') as string | null) ?? null,
        nhis_number: (pickRecordValue(patientContext, 'nhis_number') as string | null) ?? null,
        nhis_status: (pickRecordValue(patientContext, 'nhis_status') as AiReferralStructuredData['nhis_status']) ?? null,
        contact_number: (pickRecordValue(patientContext, 'contact_number') as string | null) ?? null,
        presenting_complaint: extractedComplaint,
        clinical_history: history,
        examination_findings: extractExaminationFindings(normalized),
        working_diagnosis: extractedDiagnosis,
        investigations_done: extractInvestigations(normalized),
        treatment_given: extractTreatment(normalized),
        reason_for_referral: extractReasonForReferral(normalized) || buildReasonForReferralFallback(extractedDiagnosis, extractedComplaint, extractedUrgency),
        referral_reason: detectReferralReason(normalized),
        urgency_level: extractedUrgency,
        severity: extractSeverity(normalized),
        stability: extractStability(normalized),
        known_allergies: extractFirst([/(?:allergy|allergies) to\s+(.+?)(?:,|\.|;)/i], normalized),
        pre_existing_conditions: preExisting,
        vital_signs: Object.keys(vitals).length ? vitals : null,
    };

    if (partialForm) {
        ['full_name', 'date_of_birth', 'address', 'contact_number', 'nhis_number', 'nhis_status'].forEach((key) => {
            const currentValue = structuredData[key as keyof AiReferralStructuredData];
            const fallbackValue = partialForm[key];
            if ((currentValue === null || currentValue === undefined || currentValue === '') && fallbackValue) {
                structuredData[key as keyof AiReferralStructuredData] = fallbackValue as never;
            }
        });
    }

    const detectedFields = Object.entries(structuredData)
        .filter(([, value]) => value !== null && value !== undefined && value !== '' && !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0))
        .map(([key]) => key)
        .sort();

    const warnings: string[] = [];
    if (age && estimatedDob && !explicitDob) {
        warnings.push(`Date of birth was estimated from the stated age (${age}). Please confirm it before submitting.`);
    } else if (age && !structuredData.date_of_birth) {
        warnings.push(`Age ${age} was detected in voice input, but date of birth still needs confirmation.`);
    }
    if (!structuredData.presenting_complaint) {
        warnings.push('Presenting complaint was not confidently extracted.');
    }
    if (!structuredData.working_diagnosis) {
        warnings.push('Working diagnosis was not confidently extracted.');
    }
    if (!structuredData.reason_for_referral) {
        warnings.push('Reason for referral may need manual completion.');
    }

    const missingFields = ['presenting_complaint', 'working_diagnosis', 'reason_for_referral', 'referral_reason']
        .filter((field) => !structuredData[field as keyof AiReferralStructuredData]);

    return {
        transcript: transcript.trim(),
        normalized_transcript: normalized
            .split('. ')
            .map((part) => prettyText(part) || '')
            .filter(Boolean)
            .join(' '),
        structured_data: structuredData,
        meta: {
            detected_fields: detectedFields,
            missing_fields: missingFields,
            patient_age: age,
        },
        warnings,
    };
}
