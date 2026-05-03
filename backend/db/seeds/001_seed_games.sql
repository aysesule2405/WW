-- 001_seed_games.sql
INSERT INTO games (slug, title, is_active)
VALUES
  ('delivery-on-the-wind', 'Delivery on the Wind', 1),
  ('spirit-drift', 'Spirit Drift', 1),
  ('spirit-sapling', 'Spirit Sapling', 1)
ON DUPLICATE KEY UPDATE title = VALUES(title), is_active = VALUES(is_active);
