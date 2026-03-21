-- Migration: Stage 4 (Vitals, Incident Location, Routing Metadata)
-- Adds columns to capture missing patient data and store routing engine decisions.

-- 1. Vital signs (FR002) as JSONB to allow flexible key-value pairs (BP, HR, Temp, etc.)
ALTER TABLE referral_details ADD COLUMN vital_signs JSONB;

-- 2. Incident location (FR012) as coordinates
ALTER TABLE referrals ADD COLUMN incident_lat NUMERIC(10,6);
ALTER TABLE referrals ADD COLUMN incident_lon NUMERIC(10,6);

-- 3. Routing decision metadata (FR014) to persist the engine's ranked list and calculated distances
ALTER TABLE referrals ADD COLUMN routing_metadata JSONB;
