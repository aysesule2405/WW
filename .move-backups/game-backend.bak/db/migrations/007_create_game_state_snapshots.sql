-- 007_create_game_state_snapshots.sql
CREATE TABLE IF NOT EXISTS game_state_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  game_id BIGINT UNSIGNED NOT NULL,
  state_json JSON NOT NULL,
  version INT NOT NULL DEFAULT 1,
  saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_state_user_game (user_id, game_id),
  CONSTRAINT fk_snapshots_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_snapshots_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
