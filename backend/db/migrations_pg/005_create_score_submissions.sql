-- 005_create_score_submissions.sql (PostgreSQL)
CREATE TABLE IF NOT EXISTS score_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  score BIGINT NOT NULL,
  metadata_json JSONB NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes to support leaderboards queries: get top scores per game quickly
CREATE INDEX IF NOT EXISTS idx_score_game_desc ON score_submissions (game_id, score DESC, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_user_game ON score_submissions (user_id, game_id, submitted_at DESC);
