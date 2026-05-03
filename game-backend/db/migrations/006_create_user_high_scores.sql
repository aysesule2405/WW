-- 006_create_user_high_scores.sql
CREATE TABLE IF NOT EXISTS user_high_scores (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  game_id BIGINT UNSIGNED NOT NULL,
  high_score BIGINT NOT NULL,
  achieved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_game_high (user_id, game_id),
  INDEX idx_game_high (game_id, high_score DESC),
  CONSTRAINT fk_highscores_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_highscores_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
