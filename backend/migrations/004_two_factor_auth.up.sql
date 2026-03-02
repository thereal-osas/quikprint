-- Add two-factor authentication columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- Create table for 2FA pending verification sessions
CREATE TABLE IF NOT EXISTS two_factor_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick session lookup
CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_token ON two_factor_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_user_id ON two_factor_sessions(user_id);

