-- Split App: Settlement Requests
-- Run with: wrangler d1 execute split-db --local --file=./migrations/004_settlement_requests.sql

-- Add settlement_requested flag to ExpenseSplits
-- When a debtor clicks "Settle Up", this flag is set to 1.
-- The payer must then approve to finalize (is_paid = 1).
ALTER TABLE ExpenseSplits ADD COLUMN settlement_requested INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_expense_splits_settlement ON ExpenseSplits(settlement_requested);
