-- Split App: Add a dedicated username column (kept separate from name)
-- Run with: wrangler d1 execute split-db --remote --file=./migrations/006_username.sql

ALTER TABLE Users ADD COLUMN username TEXT;

-- Unique index enforces username uniqueness at the DB level.
-- Multiple NULLs are allowed, so existing rows (username IS NULL)
-- won't conflict until the one-time backfill below is run.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON Users(username);
