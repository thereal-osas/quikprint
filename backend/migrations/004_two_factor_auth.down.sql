-- Remove two-factor authentication
DROP TABLE IF EXISTS two_factor_sessions;
ALTER TABLE users DROP COLUMN IF EXISTS two_factor_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS two_factor_secret;

