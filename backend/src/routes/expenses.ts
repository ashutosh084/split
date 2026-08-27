import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Bindings, Variables } from "../types";
import { authRequired } from "../middleware/auth";
import { uuid } from "../utils/helpers";

// --- Schemas ---

const splitSchema = z.object({
  userId: z.string().uuid(),
  amountOwed: z.number().positive().max(10_000_000, "Amount too large"),
});

const createExpenseSchema = z.object({
  amount: z.number().positive().max(10_000_000, "Amount too large"),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  splits: z.array(splitSchema).min(1),
  groupId: z.string().uuid().optional(),
});

export const expenseRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// All expense routes require authentication
expenseRoutes.use("*", authRequired);

/**
 * POST /api/expenses
 * Creates a new expense with splits and optional tags.
 * Validates that the sum of all splits equals the expense amount.
 * Executed in a D1 batch for atomicity.
 */
expenseRoutes.post("/", zValidator("json", createExpenseSchema), async (c) => {
  const { amount, name, description, tags, splits, groupId } =
    c.req.valid("json");
  const currentUser = c.get("user");
  const db = c.env.DB;

  // Validate: sum of splits must equal amount
  const splitSum = splits.reduce((sum, s) => sum + s.amountOwed, 0);
  if (Math.abs(splitSum - amount) > 0.01) {
    return c.json(
      {
        error: `Split sum (${splitSum}) must equal the total amount (${amount})`,
      },
      400,
    );
  }

  const expenseId = uuid();
  const now = Math.floor(Date.now() / 1000);

  // Build batch statements
  const statements: D1PreparedStatement[] = [];

  // 1. Insert the expense
  statements.push(
    db
      .prepare(
        "INSERT INTO Expenses (id, payer_id, amount, name, description, group_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        expenseId,
        currentUser.userId,
        amount,
        name,
        description || null,
        groupId || null,
        now,
      ),
  );

  // 2. Insert splits (payer's share is auto-marked as paid)
  for (const split of splits) {
    const isPaid = split.userId === currentUser.userId ? 1 : 0;
    statements.push(
      db
        .prepare(
          "INSERT INTO ExpenseSplits (id, expense_id, user_id, amount_owed, is_paid) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(uuid(), expenseId, split.userId, split.amountOwed, isPaid),
    );
  }

  // 3. Insert tags if provided
  if (tags && tags.length > 0) {
    for (const tagName of tags) {
      // Upsert: get or create tag
      let tag = await db
        .prepare("SELECT id FROM Tags WHERE name = ?")
        .bind(tagName)
        .first<{ id: string }>();

      if (!tag) {
        const tagId = uuid();
        await db
          .prepare("INSERT INTO Tags (id, name) VALUES (?, ?)")
          .bind(tagId, tagName)
          .run();
        tag = { id: tagId };
      }

      statements.push(
        db
          .prepare("INSERT INTO ExpenseTags (expense_id, tag_id) VALUES (?, ?)")
          .bind(expenseId, tag.id),
      );

      // Track that this user has used this tag (for suggestions)
      await db
        .prepare(
          "INSERT OR IGNORE INTO UserTags (user_id, tag_id) VALUES (?, ?)",
        )
        .bind(currentUser.userId, tag.id)
        .run();
    }
  }

  // Execute all statements in a batch
  await db.batch(statements);

  return c.json({ message: "Expense created", expenseId }, 201);
});

/**
 * PATCH /api/expenses/:id/settle
 * Requests settlement for the current user's split.
 * Sets settlement_requested = 1. The payer must approve to finalize.
 */
expenseRoutes.patch("/:id/settle", async (c) => {
  const expenseId = c.req.param("id");
  const currentUser = c.get("user");
  const db = c.env.DB;

  const split = await db
    .prepare(
      "SELECT id, user_id, is_paid, settlement_requested FROM ExpenseSplits WHERE expense_id = ? AND user_id = ?",
    )
    .bind(expenseId, currentUser.userId)
    .first<{
      id: string;
      user_id: string;
      is_paid: number;
      settlement_requested: number;
    }>();

  if (!split) {
    return c.json({ error: "You are not part of this expense" }, 403);
  }

  if (split.is_paid) {
    return c.json({ error: "Already settled" }, 400);
  }

  if (split.settlement_requested) {
    return c.json(
      { error: "Settlement already requested — awaiting payer approval" },
      400,
    );
  }

  await db
    .prepare(
      "UPDATE ExpenseSplits SET settlement_requested = 1 WHERE expense_id = ? AND user_id = ?",
    )
    .bind(expenseId, currentUser.userId)
    .run();

  return c.json({ message: "Settlement requested — awaiting payer approval" });
});

/**
 * PATCH /api/expenses/:id/settle/:splitId/approve
 * Approves a settlement request. Only the payer of the expense can approve.
 */
expenseRoutes.patch("/:id/settle/:splitId/approve", async (c) => {
  const expenseId = c.req.param("id");
  const splitId = c.req.param("splitId");
  const currentUser = c.get("user");
  const db = c.env.DB;

  // Verify the current user is the payer
  const expense = await db
    .prepare("SELECT id, payer_id FROM Expenses WHERE id = ?")
    .bind(expenseId)
    .first<{ id: string; payer_id: string }>();

  if (!expense) {
    return c.json({ error: "Expense not found" }, 404);
  }

  if (expense.payer_id !== currentUser.userId) {
    return c.json({ error: "Only the payer can approve settlements" }, 403);
  }

  const split = await db
    .prepare(
      "SELECT id, is_paid, settlement_requested FROM ExpenseSplits WHERE id = ? AND expense_id = ?",
    )
    .bind(splitId, expenseId)
    .first<{ id: string; is_paid: number; settlement_requested: number }>();

  if (!split) {
    return c.json({ error: "Split not found" }, 404);
  }

  if (split.is_paid) {
    return c.json({ error: "Already settled" }, 400);
  }

  if (!split.settlement_requested) {
    return c.json({ error: "No settlement request to approve" }, 400);
  }

  await db
    .prepare(
      "UPDATE ExpenseSplits SET is_paid = 1, settlement_requested = 0 WHERE id = ?",
    )
    .bind(splitId)
    .run();

  return c.json({ message: "Settlement approved" });
});

/**
 * GET /api/expenses
 * Lists all expenses the current user is involved in, with tags.
 */
expenseRoutes.get("/", async (c) => {
  const currentUser = c.get("user");
  const db = c.env.DB;

  const expenses = await db
    .prepare(
      `SELECT DISTINCT e.id, e.payer_id, e.amount, e.name, e.description, e.created_at,
              p.name as payer_name
       FROM Expenses e
       JOIN Users p ON e.payer_id = p.id
       JOIN ExpenseSplits s ON s.expense_id = e.id
       WHERE s.user_id = ? OR e.payer_id = ?
       ORDER BY e.created_at DESC`,
    )
    .bind(currentUser.userId, currentUser.userId)
    .all();

  const rows = expenses.results as Array<Record<string, unknown>>;

  // Fetch tags for all returned expenses in one query
  if (rows.length > 0) {
    const placeholders = rows.map(() => "?").join(",");
    const ids = rows.map((r) => r.id as string);
    const tagRows = await db
      .prepare(
        `SELECT et.expense_id, t.id, t.name
         FROM ExpenseTags et
         JOIN Tags t ON et.tag_id = t.id
         WHERE et.expense_id IN (${placeholders})`,
      )
      .bind(...ids)
      .all();

    const tagsByExpense: Record<
      string,
      Array<{ id: string; name: string }>
    > = {};
    for (const tr of tagRows.results as Array<{
      expense_id: string;
      id: string;
      name: string;
    }>) {
      if (!tagsByExpense[tr.expense_id]) tagsByExpense[tr.expense_id] = [];
      tagsByExpense[tr.expense_id].push({ id: tr.id, name: tr.name });
    }

    for (const row of rows) {
      (row as Record<string, unknown>).tags =
        tagsByExpense[row.id as string] || [];
    }
  }

  return c.json({ expenses: rows });
});

/**
 * GET /api/expenses/:id
 * Gets a single expense with its splits and tags.
 */
expenseRoutes.get("/:id", async (c) => {
  const expenseId = c.req.param("id");
  const db = c.env.DB;

  const expense = await db
    .prepare(
      `SELECT e.id, e.payer_id, e.amount, e.name, e.description, e.created_at,
              p.name as payer_name
       FROM Expenses e
       JOIN Users p ON e.payer_id = p.id
       WHERE e.id = ?`,
    )
    .bind(expenseId)
    .first();

  if (!expense) {
    return c.json({ error: "Expense not found" }, 404);
  }

  const splits = await db
    .prepare(
      `SELECT s.id, s.user_id, s.amount_owed, s.is_paid, s.settlement_requested, u.name as user_name
       FROM ExpenseSplits s
       JOIN Users u ON s.user_id = u.id
       WHERE s.expense_id = ?`,
    )
    .bind(expenseId)
    .all();

  const tags = await db
    .prepare(
      `SELECT t.id, t.name
       FROM Tags t
       JOIN ExpenseTags et ON et.tag_id = t.id
       WHERE et.expense_id = ?`,
    )
    .bind(expenseId)
    .all();

  return c.json({
    ...expense,
    splits: splits.results,
    tags: tags.results,
  });
});
