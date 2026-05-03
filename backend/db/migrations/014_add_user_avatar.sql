-- 014_add_user_avatar.sql
ALTER TABLE users
  ADD COLUMN avatar_url VARCHAR(512) NULL AFTER updated_at;
