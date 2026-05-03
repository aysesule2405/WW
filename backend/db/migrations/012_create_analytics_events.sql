-- 012_create_analytics_events.sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  game_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(150) NOT NULL,
  event_payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type_created (event_type, created_at DESC),
  INDEX idx_game_created (game_id, created_at DESC),
  INDEX idx_user_created (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
