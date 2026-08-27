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
INSERT INTO "Users" ("id","email","password_hash","name","is_approved","is_admin") VALUES('8c9616f5-891a-43d7-93f2-d99e4c341ddf','ankitas2899@gmail.com','eecd514159ffed3c4d7031b713a91e48832117b32c05fe4b14e3087dbf04109c','Ankita Singh',1,0);
INSERT INTO "Users" ("id","email","password_hash","name","is_approved","is_admin") VALUES('98226e88-b453-4969-a41e-29d7813fe826','a@a.com','067cbbcedb8d7fcfdd28d96a1c78860013727f5de4d39035d8510f35a08a7e98','A',1,0);
INSERT INTO "Users" ("id","email","password_hash","name","is_approved","is_admin") VALUES('32bd62d6-605a-4c68-936e-06d44033ddd5','asp3@asp.com','8776f108e247ab1e2b323042c049c266407c81fbad41bde1e8dfc1bb66fd267e','asp3',1,0);
CREATE TABLE Friends (
    user_id_1 TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    user_id_2 TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id_1, user_id_2)
);
INSERT INTO "Friends" ("user_id_1","user_id_2") VALUES('815a30cf-43c0-43b2-ae38-ccc910ef6616','e62421e2-b9cd-4b76-97d4-18b9e23cce85');
INSERT INTO "Friends" ("user_id_1","user_id_2") VALUES('0af55321-0840-479e-acfa-5755827cd8d3','e62421e2-b9cd-4b76-97d4-18b9e23cce85');
INSERT INTO "Friends" ("user_id_1","user_id_2") VALUES('815a30cf-43c0-43b2-ae38-ccc910ef6616','0af55321-0840-479e-acfa-5755827cd8d3');
CREATE TABLE Expenses (
    id          TEXT PRIMARY KEY,
    payer_id    TEXT NOT NULL REFERENCES Users(id),
    amount      REAL NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  INTEGER NOT NULL
, group_id TEXT REFERENCES Groups(id) ON DELETE SET NULL);
INSERT INTO "Expenses" ("id","payer_id","amount","name","description","created_at","group_id") VALUES('531d6fb3-8e16-4296-ba4e-dedf71762e8d','e62421e2-b9cd-4b76-97d4-18b9e23cce85',1000000,'asdasd','asdwad',1786390338,NULL);
INSERT INTO "Expenses" ("id","payer_id","amount","name","description","created_at","group_id") VALUES('9b085018-f1c4-4c73-97e6-d72604171275','815a30cf-43c0-43b2-ae38-ccc910ef6616',1234234,'pappu','asdsad',1786393075,NULL);
INSERT INTO "Expenses" ("id","payer_id","amount","name","description","created_at","group_id") VALUES('0a35a62e-e30b-4b36-b086-8dabf201de86','0af55321-0840-479e-acfa-5755827cd8d3',233424234,'sdsdd','sadasd',1786393618,NULL);
INSERT INTO "Expenses" ("id","payer_id","amount","name","description","created_at","group_id") VALUES('67d4d3ee-7069-4c47-97aa-a02b312ca786','0af55321-0840-479e-acfa-5755827cd8d3',2.3e+214,'asasd','aasdad',1786393713,NULL);
INSERT INTO "Expenses" ("id","payer_id","amount","name","description","created_at","group_id") VALUES('2896ab88-a388-4ecd-a95e-0a50aee3e358','815a30cf-43c0-43b2-ae38-ccc910ef6616',19476,'Shaah','Ehahs',1786433318,NULL);
INSERT INTO "Expenses" ("id","payer_id","amount","name","description","created_at","group_id") VALUES('5eb4cbad-4d46-4264-a1af-26f6f5441aa9','815a30cf-43c0-43b2-ae38-ccc910ef6616',464,'Ddn','Wwii',1786554058,'f1fd90ee-5fc4-419e-ba56-1d7e7e921c5e');
CREATE TABLE ExpenseSplits (
    id          TEXT PRIMARY KEY,
    expense_id  TEXT NOT NULL REFERENCES Expenses(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES Users(id),
    amount_owed REAL NOT NULL,
    is_paid     INTEGER NOT NULL DEFAULT 0
, settlement_requested INTEGER NOT NULL DEFAULT 0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('afddc30c-7a2e-48c4-8c4d-4bd05eae22f1','531d6fb3-8e16-4296-ba4e-dedf71762e8d','815a30cf-43c0-43b2-ae38-ccc910ef6616',500000,1,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('0ebeca30-effc-487e-8d83-7c58ce1eaae0','531d6fb3-8e16-4296-ba4e-dedf71762e8d','0af55321-0840-479e-acfa-5755827cd8d3',500000,1,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('e9d029ce-65ef-4e63-9109-07a1c9d1f2e9','9b085018-f1c4-4c73-97e6-d72604171275','815a30cf-43c0-43b2-ae38-ccc910ef6616',411411,1,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('5e373028-9755-4ce7-9d27-c3eb3468a2c7','9b085018-f1c4-4c73-97e6-d72604171275','0af55321-0840-479e-acfa-5755827cd8d3',411411,0,1);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('a14bf5d8-3e02-4841-b21b-cddfd55d39e9','9b085018-f1c4-4c73-97e6-d72604171275','e62421e2-b9cd-4b76-97d4-18b9e23cce85',411412,0,1);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('95b4cef1-451d-4422-985f-2712b05c7159','0a35a62e-e30b-4b36-b086-8dabf201de86','0af55321-0840-479e-acfa-5755827cd8d3',77808078,1,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('a93ffc2a-6c98-4a7c-a52d-f2f5643ff92c','0a35a62e-e30b-4b36-b086-8dabf201de86','e62421e2-b9cd-4b76-97d4-18b9e23cce85',77808078,1,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('121aaffc-0670-475b-9b6c-ca66eeacf19d','0a35a62e-e30b-4b36-b086-8dabf201de86','815a30cf-43c0-43b2-ae38-ccc910ef6616',77808078,1,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('07278cca-66a9-4692-9de0-1c8ff1699cfc','67d4d3ee-7069-4c47-97aa-a02b312ca786','0af55321-0840-479e-acfa-5755827cd8d3',7.666666666666666e+213,1,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('008df711-41fc-4596-87b1-6cca98651409','67d4d3ee-7069-4c47-97aa-a02b312ca786','e62421e2-b9cd-4b76-97d4-18b9e23cce85',7.666666666666666e+213,0,1);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('ab790fa4-c825-4abc-a1db-9400a022f3fb','67d4d3ee-7069-4c47-97aa-a02b312ca786','815a30cf-43c0-43b2-ae38-ccc910ef6616',7.666666666666666e+213,0,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('a8a8e0ca-5f30-4609-9d09-de46df77d4b3','2896ab88-a388-4ecd-a95e-0a50aee3e358','815a30cf-43c0-43b2-ae38-ccc910ef6616',6492,1,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('950b6774-6ab3-4148-bae6-66437e5c0842','2896ab88-a388-4ecd-a95e-0a50aee3e358','0af55321-0840-479e-acfa-5755827cd8d3',6492,0,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('6dbf5104-88fb-4462-b19e-bea98d0d5358','2896ab88-a388-4ecd-a95e-0a50aee3e358','e62421e2-b9cd-4b76-97d4-18b9e23cce85',6492,0,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('85ab93bc-9654-4cf6-b518-27a17b55ca7a','5eb4cbad-4d46-4264-a1af-26f6f5441aa9','815a30cf-43c0-43b2-ae38-ccc910ef6616',154.66,1,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('384998cb-79ed-42c8-90a3-4f85ac4423b5','5eb4cbad-4d46-4264-a1af-26f6f5441aa9','e62421e2-b9cd-4b76-97d4-18b9e23cce85',154.66,0,0);
INSERT INTO "ExpenseSplits" ("id","expense_id","user_id","amount_owed","is_paid","settlement_requested") VALUES('779a2658-5c08-4f38-b5b6-4cdf9c4e5a96','5eb4cbad-4d46-4264-a1af-26f6f5441aa9','0af55321-0840-479e-acfa-5755827cd8d3',154.68,0,0);
CREATE TABLE Tags (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
INSERT INTO "Tags" ("id","name") VALUES('cb142f2d-a67a-45ac-8d79-2b66d6cbb639','awd');
INSERT INTO "Tags" ("id","name") VALUES('74f6b7cb-411d-44da-8bce-4bf570c4c00c','test');
INSERT INTO "Tags" ("id","name") VALUES('260e6d08-86b8-4c98-be85-f65735e5e041','mytag');
INSERT INTO "Tags" ("id","name") VALUES('4f3dff46-6729-49c5-b8bd-925638285768','yooo');
INSERT INTO "Tags" ("id","name") VALUES('896ece21-650b-4221-bd82-869ef6284a25','vanialltrip');
CREATE TABLE ExpenseTags (
    expense_id TEXT NOT NULL REFERENCES Expenses(id) ON DELETE CASCADE,
    tag_id     TEXT NOT NULL REFERENCES Tags(id) ON DELETE CASCADE,
    PRIMARY KEY (expense_id, tag_id)
);
INSERT INTO "ExpenseTags" ("expense_id","tag_id") VALUES('531d6fb3-8e16-4296-ba4e-dedf71762e8d','cb142f2d-a67a-45ac-8d79-2b66d6cbb639');
INSERT INTO "ExpenseTags" ("expense_id","tag_id") VALUES('9b085018-f1c4-4c73-97e6-d72604171275','74f6b7cb-411d-44da-8bce-4bf570c4c00c');
INSERT INTO "ExpenseTags" ("expense_id","tag_id") VALUES('9b085018-f1c4-4c73-97e6-d72604171275','260e6d08-86b8-4c98-be85-f65735e5e041');
INSERT INTO "ExpenseTags" ("expense_id","tag_id") VALUES('9b085018-f1c4-4c73-97e6-d72604171275','4f3dff46-6729-49c5-b8bd-925638285768');
INSERT INTO "ExpenseTags" ("expense_id","tag_id") VALUES('9b085018-f1c4-4c73-97e6-d72604171275','896ece21-650b-4221-bd82-869ef6284a25');
INSERT INTO "ExpenseTags" ("expense_id","tag_id") VALUES('0a35a62e-e30b-4b36-b086-8dabf201de86','260e6d08-86b8-4c98-be85-f65735e5e041');
INSERT INTO "ExpenseTags" ("expense_id","tag_id") VALUES('0a35a62e-e30b-4b36-b086-8dabf201de86','896ece21-650b-4221-bd82-869ef6284a25');
INSERT INTO "ExpenseTags" ("expense_id","tag_id") VALUES('67d4d3ee-7069-4c47-97aa-a02b312ca786','260e6d08-86b8-4c98-be85-f65735e5e041');
INSERT INTO "ExpenseTags" ("expense_id","tag_id") VALUES('67d4d3ee-7069-4c47-97aa-a02b312ca786','74f6b7cb-411d-44da-8bce-4bf570c4c00c');
INSERT INTO "ExpenseTags" ("expense_id","tag_id") VALUES('5eb4cbad-4d46-4264-a1af-26f6f5441aa9','260e6d08-86b8-4c98-be85-f65735e5e041');
CREATE TABLE FriendRequests (
    id            TEXT PRIMARY KEY,
    from_user_id  TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    to_user_id    TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at    INTEGER NOT NULL,
    UNIQUE(from_user_id, to_user_id)
);
INSERT INTO "FriendRequests" ("id","from_user_id","to_user_id","status","created_at") VALUES('a772a89f-5d1b-462e-968a-600859cba965','815a30cf-43c0-43b2-ae38-ccc910ef6616','0af55321-0840-479e-acfa-5755827cd8d3','accepted',1786392969);
CREATE TABLE UserTags (
    user_id TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    tag_id  TEXT NOT NULL REFERENCES Tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);
INSERT INTO "UserTags" ("user_id","tag_id") VALUES('815a30cf-43c0-43b2-ae38-ccc910ef6616','74f6b7cb-411d-44da-8bce-4bf570c4c00c');
INSERT INTO "UserTags" ("user_id","tag_id") VALUES('815a30cf-43c0-43b2-ae38-ccc910ef6616','260e6d08-86b8-4c98-be85-f65735e5e041');
INSERT INTO "UserTags" ("user_id","tag_id") VALUES('815a30cf-43c0-43b2-ae38-ccc910ef6616','4f3dff46-6729-49c5-b8bd-925638285768');
INSERT INTO "UserTags" ("user_id","tag_id") VALUES('815a30cf-43c0-43b2-ae38-ccc910ef6616','896ece21-650b-4221-bd82-869ef6284a25');
INSERT INTO "UserTags" ("user_id","tag_id") VALUES('0af55321-0840-479e-acfa-5755827cd8d3','260e6d08-86b8-4c98-be85-f65735e5e041');
INSERT INTO "UserTags" ("user_id","tag_id") VALUES('0af55321-0840-479e-acfa-5755827cd8d3','896ece21-650b-4221-bd82-869ef6284a25');
INSERT INTO "UserTags" ("user_id","tag_id") VALUES('0af55321-0840-479e-acfa-5755827cd8d3','74f6b7cb-411d-44da-8bce-4bf570c4c00c');
CREATE TABLE Groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
INSERT INTO "Groups" ("id","name","description","created_by","created_at") VALUES('f1fd90ee-5fc4-419e-ba56-1d7e7e921c5e','LMFAO','LMFAO2','815a30cf-43c0-43b2-ae38-ccc910ef6616',1786553909);
CREATE TABLE GroupMembers (
  group_id TEXT NOT NULL REFERENCES Groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);
INSERT INTO "GroupMembers" ("group_id","user_id") VALUES('f1fd90ee-5fc4-419e-ba56-1d7e7e921c5e','815a30cf-43c0-43b2-ae38-ccc910ef6616');
INSERT INTO "GroupMembers" ("group_id","user_id") VALUES('f1fd90ee-5fc4-419e-ba56-1d7e7e921c5e','0af55321-0840-479e-acfa-5755827cd8d3');
INSERT INTO "GroupMembers" ("group_id","user_id") VALUES('f1fd90ee-5fc4-419e-ba56-1d7e7e921c5e','e62421e2-b9cd-4b76-97d4-18b9e23cce85');
CREATE INDEX idx_expenses_payer ON Expenses(payer_id);
CREATE INDEX idx_expense_splits_expense ON ExpenseSplits(expense_id);
CREATE INDEX idx_expense_splits_user ON ExpenseSplits(user_id);
CREATE INDEX idx_expense_splits_paid ON ExpenseSplits(is_paid);
CREATE INDEX idx_friends_user1 ON Friends(user_id_1);
CREATE INDEX idx_friends_user2 ON Friends(user_id_2);
CREATE INDEX idx_expense_tags_expense ON ExpenseTags(expense_id);
CREATE INDEX idx_friend_requests_from ON FriendRequests(from_user_id);
CREATE INDEX idx_friend_requests_to ON FriendRequests(to_user_id);
CREATE INDEX idx_friend_requests_status ON FriendRequests(status);
CREATE INDEX idx_user_tags_user ON UserTags(user_id);
CREATE INDEX idx_user_tags_tag ON UserTags(tag_id);
CREATE INDEX idx_expense_splits_settlement ON ExpenseSplits(settlement_requested);
CREATE INDEX idx_groups_created_by ON Groups(created_by);
CREATE INDEX idx_group_members_user ON GroupMembers(user_id);
CREATE INDEX idx_expenses_group ON Expenses(group_id);
