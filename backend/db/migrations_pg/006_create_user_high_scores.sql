-- 006_create_user_high_scores.sql (PostgreSQL)
CREATE TABLE IF NOT EXISTS user_high_scores (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  high_score BIGINT NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_game_high UNIQUE (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_high ON user_high_scores (game_id, high_score DESC);
