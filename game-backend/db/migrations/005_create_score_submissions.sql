-- 005_create_score_submissions.sql
CREATE TABLE IF NOT EXISTS score_submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  game_id BIGINT UNSIGNED NOT NULL,
  score BIGINT NOT NULL,
  metadata_json JSON NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_score_game (game_id, score DESC, submitted_at DESC),
  INDEX idx_score_user_game (user_id, game_id, submitted_at DESC),
  CONSTRAINT fk_scores_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_scores_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
