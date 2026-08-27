-- Split App: Friend Requests migration
-- Run with: wrangler d1 execute split-db --local --file=./migrations/002_friend_requests.sql

-- Friend Requests table (pending/accepted/rejected)
CREATE TABLE IF NOT EXISTS FriendRequests (
    id            TEXT PRIMARY KEY,
    from_user_id  TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    to_user_id    TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at    INTEGER NOT NULL,
    UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON FriendRequests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON FriendRequests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON FriendRequests(status);
