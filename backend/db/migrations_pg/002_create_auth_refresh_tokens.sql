-- 002_create_auth_refresh_tokens.sql (PostgreSQL)
CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_token_hash UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_refresh_user_expires ON auth_refresh_tokens (user_id, expires_at);
