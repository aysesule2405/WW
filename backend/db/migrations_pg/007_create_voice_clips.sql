-- 007_create_voice_clips.sql (PostgreSQL)
CREATE TABLE IF NOT EXISTS voice_clips (
  id BIGSERIAL PRIMARY KEY,
  prompt_hash VARCHAR(128) NOT NULL,
  guardian_id VARCHAR(64) NOT NULL,
  s3_path TEXT NULL,
  content_type VARCHAR(64) NULL,
  duration_ms INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (prompt_hash)
);

CREATE INDEX IF NOT EXISTS idx_voice_prompt_hash ON voice_clips (prompt_hash);
