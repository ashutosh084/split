-- Split App: Initial Schema Migration
-- Run with: wrangler d1 execute split-db --local --file=./migrations/001_initial.sql

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    is_approved   INTEGER NOT NULL DEFAULT 0,
    is_admin      INTEGER NOT NULL DEFAULT 0
);

-- Friends (bidirectional relationship)
CREATE TABLE IF NOT EXISTS Friends (
    user_id_1 TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    user_id_2 TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id_1, user_id_2)
);

-- Expenses
CREATE TABLE IF NOT EXISTS Expenses (
    id          TEXT PRIMARY KEY,
    payer_id    TEXT NOT NULL REFERENCES Users(id),
    amount      REAL NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  INTEGER NOT NULL
);

-- Expense Splits
CREATE TABLE IF NOT EXISTS ExpenseSplits (
    id          TEXT PRIMARY KEY,
    expense_id  TEXT NOT NULL REFERENCES Expenses(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES Users(id),
    amount_owed REAL NOT NULL,
    is_paid     INTEGER NOT NULL DEFAULT 0
);

-- Tags
CREATE TABLE IF NOT EXISTS Tags (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Expense-Tag junction
CREATE TABLE IF NOT EXISTS ExpenseTags (
    expense_id TEXT NOT NULL REFERENCES Expenses(id) ON DELETE CASCADE,
    tag_id     TEXT NOT NULL REFERENCES Tags(id) ON DELETE CASCADE,
    PRIMARY KEY (expense_id, tag_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_expenses_payer ON Expenses(payer_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON ExpenseSplits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user ON ExpenseSplits(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_paid ON ExpenseSplits(is_paid);
CREATE INDEX IF NOT EXISTS idx_friends_user1 ON Friends(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friends_user2 ON Friends(user_id_2);
CREATE INDEX IF NOT EXISTS idx_expense_tags_expense ON ExpenseTags(expense_id);
