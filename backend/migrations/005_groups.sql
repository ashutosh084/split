-- Groups feature
-- A group is a named collection of users (members) for organizing expenses
-- around a shared activity (trip, event, etc.).

CREATE TABLE IF NOT EXISTS Groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS GroupMembers (
  group_id TEXT NOT NULL REFERENCES Groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);

-- Expenses may optionally belong to a group.
ALTER TABLE Expenses ADD COLUMN group_id TEXT REFERENCES Groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_groups_created_by ON Groups(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON GroupMembers(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group ON Expenses(group_id);
