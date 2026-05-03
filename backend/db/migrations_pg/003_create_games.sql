-- 003_create_games.sql (PostgreSQL)
CREATE TABLE IF NOT EXISTS games (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(150) NOT NULL,
  title VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_games_slug UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_games_slug ON games (slug);
