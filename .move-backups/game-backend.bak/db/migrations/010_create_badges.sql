-- 010_create_badges.sql
CREATE TABLE IF NOT EXISTS badges (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(150) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  icon_url VARCHAR(1024) NULL,
  criteria_json JSON NULL,
  is_active TINYINT(1) DEFAULT 1,
  UNIQUE KEY uq_badge_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
