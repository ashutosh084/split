PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE Users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    is_approved   INTEGER NOT NULL DEFAULT 0,
    is_admin      INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "Users" ("id","email","password_hash","name","is_approved","is_admin") VALUES('815a30cf-43c0-43b2-ae38-ccc910ef6616','aspkingas@gmail.com','b07144618cd9a73364e761dad7cdcb0c749ae8b498cedb55a7b32d815fc0ed12','asp',1,1);
INSERT INTO "Users" ("id","email","password_hash","name","is_approved","is_admin") VALUES('e62421e2-b9cd-4b76-97d4-18b9e23cce85','asp1@gmail.com','8776f108e247ab1e2b323042c049c266407c81fbad41bde1e8dfc1bb66fd267e','asp1',1,0);
INSERT INTO "Users" ("id","email","password_hash","name","is_approved","is_admin") VALUES('0af55321-0840-479e-acfa-5755827cd8d3','asp2@gmail.com','8776f108e247ab1e2b323042c049c266407c81fbad41bde1e8dfc1bb66fd267e','asp2',1,0);
CREATE TABLE Friends (
    user_id_1 TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    user_id_2 TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id_1, user_id_2)
);
INSERT INTO "Friends" ("user_id_1","user_id_2") VALUES('815a30cf-43c0-43b2-ae38-ccc910ef6616','e62421e2-b9cd-4b76-97d4-18b9e23cce85');
INSERT INTO "Friends" ("user_id_1","user_id_2") VALUES('0af55321-0840-479e-acfa-5755827cd8d3','e62421e2-b9cd-4b76-97d4-18b9e23cce85');
CREATE TABLE Expenses (
    id          TEXT PRIMARY KEY,
    payer_id    TEXT NOT NULL REFERENCES Users(id),
    amount      REAL NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  INTEGER NOT NULL
);
INSERT INTO "Expenses" ("id","payer_id","amount","name","description","created_at") VALUES('531d6fb3-8e16-4296-ba4e-dedf71762e8d','e62421e2-b9cd-4b76-97d4-18b9e23cce85',1000000,'asdasd','asdwad',1786390338);
CREATE TABLE ExpenseSplits (
    id          TEXT PRIMARY KEY,
    expense_id  TEXT NOT NULL REFERENCES Expenses(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES Users(id),
    amount_owed REAL NOT NULL,
    is_paid     INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid") VALUES('afddc30c-7a2e-48c4-8c4d-4bd05eae22f1','531d6fb3-8e16-4296-ba4e-dedf71762e8d','815a30cf-43c0-43b2-ae38-ccc910ef6616',500000,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid") VALUES('0ebeca30-effc-487e-8d83-7c58ce1eaae0','531d6fb3-8e16-4296-ba4e-dedf71762e8d','0af55321-0840-479e-acfa-5755827cd8d3',500000,0);
CREATE TABLE Tags (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
INSERT INTO "Tags" ("id","name") VALUES('cb142f2d-a67a-45ac-8d79-2b66d6cbb639','awd');
CREATE TABLE ExpenseTags (
    expense_id TEXT NOT NULL REFERENCES Expenses(id) ON DELETE CASCADE,
    tag_id     TEXT NOT NULL REFERENCES Tags(id) ON DELETE CASCADE,
    PRIMARY KEY (expense_id, tag_id)
);
INSERT INTO "ExpenseTags" ("expense_id","tag_id") VALUES('531d6fb3-8e16-4296-ba4e-dedf71762e8d','cb142f2d-a67a-45ac-8d79-2b66d6cbb639');
CREATE INDEX idx_expenses_payer ON Expenses(payer_id);
CREATE INDEX idx_expense_splits_expense ON ExpenseSplits(expense_id);
CREATE INDEX idx_expense_splits_user ON ExpenseSplits(user_id);
CREATE INDEX idx_expense_splits_paid ON ExpenseSplits(is_paid);
CREATE INDEX idx_friends_user1 ON Friends(user_id_1);
CREATE INDEX idx_friends_user2 ON Friends(user_id_2);
CREATE INDEX idx_expense_tags_expense ON ExpenseTags(expense_id);
