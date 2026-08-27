-- Split App: User Tags migration
-- Tracks which user has used which tag, so we can suggest tags
-- that the user or their friends have previously used.
-- Run with: wrangler d1 execute split-db --local --file=./migrations/003_user_tags.sql

CREATE TABLE IF NOT EXISTS UserTags (
    user_id TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    tag_id  TEXT NOT NULL REFERENCES Tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tags_user ON UserTags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag ON UserTags(tag_id);
