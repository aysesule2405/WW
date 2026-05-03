-- 008_create_challenges.sql
CREATE TABLE IF NOT EXISTS challenges (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  game_id BIGINT UNSIGNED NULL,
  code VARCHAR(150) NOT NULL,
  title VARCHAR(255) NOT NULL,
  rule_json JSON NULL,
  is_active TINYINT(1) DEFAULT 1,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  UNIQUE KEY uq_challenge_code (code),
  CONSTRAINT fk_challenge_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
