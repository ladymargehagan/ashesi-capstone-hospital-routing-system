-- ==========================================================================
-- Migration: Expand HOSPITAL_RESOURCES bed types + fix REFERRALS schema gaps
-- Run this against an existing v2 database.
-- Safe to run multiple times (uses IF NOT EXISTS / idempotent ALTER checks).
-- ==========================================================================

-- 1. Drop the old resource_type CHECK constraint and replace it
--    PostgreSQL requires you to drop and re-add named or unnamed constraints.
ALTER TABLE hospital_resources
    DROP CONSTRAINT IF EXISTS hospital_resources_resource_type_check;

ALTER TABLE hospital_resources
    ADD CONSTRAINT hospital_resources_resource_type_check
    CHECK (resource_type IN (
        -- Granular bed categories
        'general_beds',
        'emergency_beds',
        'icu_beds',
        'stroke_beds',
        'pediatric_beds',
        'maternity_beds',
        'oxygen_beds',
        'monitored_beds',
        'adjustable_beds',
        -- Equipment & services
        'theatre',
        'blood_bank',
        'lab',
        'xray',
        'ct_scan',
        'mri',
        'ultrasound',
        'dialysis',
        'ventilators',
        'oxygen'
    ));

-- 2. Add routing columns to REFERRALS if missing (from audit: these were in
--    the code but absent from the DDL)
ALTER TABLE referrals
    ADD COLUMN IF NOT EXISTS routing_queue TEXT,
    ADD COLUMN IF NOT EXISTS incident_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS incident_lon DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS routing_metadata TEXT;

-- 3. Add vital_signs to REFERRAL_DETAILS if missing
ALTER TABLE referral_details
    ADD COLUMN IF NOT EXISTS vital_signs JSONB;

-- 4. Add cascade tracking columns to REFERRALS
ALTER TABLE referrals
    ADD COLUMN IF NOT EXISTS cascade_count INTEGER NOT NULL DEFAULT 0;

-- 5. Add outcome tracking columns to REFERRALS
ALTER TABLE referrals
    ADD COLUMN IF NOT EXISTS outcome VARCHAR(30)
        CHECK (outcome IN ('discharged', 'transferred_again', 'deceased', 'ongoing')),
    ADD COLUMN IF NOT EXISTS outcome_notes TEXT,
    ADD COLUMN IF NOT EXISTS outcome_recorded_at TIMESTAMP;

-- 6. Add 'arrived' status to REFERRALS (missing from original CHECK)
--    PostgreSQL: drop and recreate the status check constraint.
ALTER TABLE referrals
    DROP CONSTRAINT IF EXISTS referrals_status_check;

ALTER TABLE referrals
    ADD CONSTRAINT referrals_status_check
    CHECK (status IN (
        'pending', 'approved', 'rejected',
        'en_route', 'arrived', 'completed', 'cancelled',
        'no_capacity'   -- all 5 cascade hospitals rejected; physician must act
    ));

-- 7. Expand NOTIFICATIONS type CHECK to include referral_cascaded and arrived
ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'hospital_approval', 'hospital_rejection',
        'physician_verification', 'physician_rejection',
        'referral_created', 'referral_approved', 'referral_rejected',
        'referral_cascaded', 'referral_completed', 'referral_cancelled',
        'patient_arrived', 'data_flagged',
        'account_approved', 'account_rejected'
    ));

-- Done.
SELECT 'Migration applied successfully.' AS result;
