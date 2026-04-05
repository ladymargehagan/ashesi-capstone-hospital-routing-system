import { ReferralFormScreen } from '@/components/referrals/referral-form-screen';

export default function ReferralFormPage() {
    return (
        <ReferralFormScreen
            mode="physician"
            backHref="/physician"
            submitRedirectHref="/physician/referrals"
        />
    );
}
