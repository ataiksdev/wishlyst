-- Add security question and answer to users
ALTER TABLE users ADD COLUMN security_question TEXT;
ALTER TABLE users ADD COLUMN security_answer_hash TEXT;

-- Index for users who have security questions set
CREATE INDEX idx_users_security_question ON users(id) WHERE security_question IS NOT NULL;
