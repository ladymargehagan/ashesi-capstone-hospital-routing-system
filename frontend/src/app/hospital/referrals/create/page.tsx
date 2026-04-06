'use client';

import { ReferralFormScreen } from '@/components/referrals/referral-form-screen';

export default function HospitalReferralCreatePage() {
    return (
        <ReferralFormScreen
            mode="hospital_admin"
            backHref="/hospital/referrals"
            submitRedirectHref="/hospital/referrals"
        />
    );
}
