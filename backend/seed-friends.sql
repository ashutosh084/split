-- Make all 6 seed users friends with each other (every unordered pair).
-- Run AFTER reset-stale.sql so the users exist.
-- Run with: wrangler d1 execute split-db --remote --file=./seed-friends.sql

-- Clear any pending/old friend requests between these users first
DELETE FROM FriendRequests
WHERE from_user_id IN ('u-asp','u-ankita','u-pranjal','u-muskan','u-nitesh','u-ishita')
   OR to_user_id   IN ('u-asp','u-ankita','u-pranjal','u-muskan','u-nitesh','u-ishita');

-- Insert one row per friendship pair (bidirectional).
-- OR IGNORE makes this safe to re-run.
INSERT OR IGNORE INTO Friends (user_id_1, user_id_2) VALUES
  ('u-asp',     'u-ankita'),
  ('u-asp',     'u-pranjal'),
  ('u-asp',     'u-muskan'),
  ('u-asp',     'u-nitesh'),
  ('u-asp',     'u-ishita'),
  ('u-ankita',  'u-pranjal'),
  ('u-ankita',  'u-muskan'),
  ('u-ankita',  'u-nitesh'),
  ('u-ankita',  'u-ishita'),
  ('u-pranjal', 'u-muskan'),
  ('u-pranjal', 'u-nitesh'),
  ('u-pranjal', 'u-ishita'),
  ('u-muskan',  'u-nitesh'),
  ('u-muskan',  'u-ishita'),
  ('u-nitesh',  'u-ishita');
