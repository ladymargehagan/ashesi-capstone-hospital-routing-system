-- Migration: Add emergency_type column to REFERRALS table
-- This field maps directly to the ReferralEngine's emergency_type parameter
-- Required values: cardiac, trauma, respiratory, stroke, obstetric, seizure, general

ALTER TABLE REFERRALS
ADD COLUMN emergency_type VARCHAR(20) NOT NULL DEFAULT 'general'
CHECK (emergency_type IN ('cardiac', 'trauma', 'respiratory', 'stroke', 'obstetric', 'seizure', 'general'));
