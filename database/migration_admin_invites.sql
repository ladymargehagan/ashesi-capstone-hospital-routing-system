-- Migration: Admin Invites
CREATE TABLE IF NOT EXISTS admin_invites (
    invite_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    hospital_id INTEGER NOT NULL REFERENCES HOSPITALS(hospital_id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_by INTEGER NOT NULL REFERENCES USERS(user_id),
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON admin_invites(token);
