-- 009_create_user_challenge_progress.sql
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  challenge_id BIGINT UNSIGNED NOT NULL,
  progress_value DECIMAL(10,2) DEFAULT 0,
  completed_at DATETIME NULL,
  UNIQUE KEY uq_user_challenge (user_id, challenge_id),
  CONSTRAINT fk_ucp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ucp_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
