CREATE TABLE IF NOT EXISTS hospital_data_flags (
    flag_id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(hospital_id),
    referral_id INTEGER REFERENCES referrals(referral_id),
    flagging_physician_id INTEGER NOT NULL REFERENCES physicians(physician_id),
    category VARCHAR(255) NOT NULL,
    notes TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS final_outcome TEXT;
