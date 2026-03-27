-- Rename 'emergency_type' to 'referral_reason' in referrals table
ALTER TABLE referrals RENAME COLUMN emergency_type TO referral_reason;

-- Add new patient condition columns
ALTER TABLE referrals ADD COLUMN urgency_level VARCHAR(50);
ALTER TABLE referrals ADD COLUMN known_allergies TEXT; -- or JSONB depending on data structure, text is fine for generic text/json dump
ALTER TABLE referrals ADD COLUMN pre_existing_conditions TEXT;
