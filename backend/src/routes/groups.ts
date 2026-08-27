import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Bindings, Variables } from "../types";
import { authRequired } from "../middleware/auth";
import { uuid, now } from "../utils/helpers";

// --- Schemas ---

const createGroupSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
});

const addMembersSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
});

export const groupRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// All group routes require authentication
groupRoutes.use("*", authRequired);

/**
 * POST /api/groups
 * Creates a new group and automatically adds the creator as a member.
 */
groupRoutes.post("/", zValidator("json", createGroupSchema), async (c) => {
  const { name, description } = c.req.valid("json");
  const currentUser = c.get("user");
  const db = c.env.DB;

  const groupId = uuid();
  const ts = now();

  await db.batch([
    db
      .prepare(
        "INSERT INTO Groups (id, name, description, created_by, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(groupId, name, description || null, currentUser.userId, ts),
    db
      .prepare("INSERT INTO GroupMembers (group_id, user_id) VALUES (?, ?)")
      .bind(groupId, currentUser.userId),
  ]);

  return c.json(
    {
      message: "Group created",
      group: {
        id: groupId,
        name,
        description: description || null,
        created_by: currentUser.userId,
        created_at: ts,
        memberCount: 1,
      },
    },
    201,
  );
});

/**
 * GET /api/groups
 * Lists all groups the current user is a member of, with member counts.
 */
groupRoutes.get("/", async (c) => {
  const currentUser = c.get("user");
  const db = c.env.DB;
  const userId = currentUser.userId;

  const groups = await db
    .prepare(
      `SELECT g.id, g.name, g.description, g.created_by, g.created_at,
              (SELECT COUNT(*) FROM GroupMembers gm WHERE gm.group_id = g.id) as memberCount,
              (SELECT COALESCE(SUM(s.amount_owed), 0)
                 FROM ExpenseSplits s
                 JOIN Expenses e ON s.expense_id = e.id
                 WHERE e.group_id = g.id AND e.payer_id = ? AND s.user_id != ? AND s.is_paid = 0) as lent,
              (SELECT COALESCE(SUM(s.amount_owed), 0)
                 FROM ExpenseSplits s
                 JOIN Expenses e ON s.expense_id = e.id
                 WHERE e.group_id = g.id AND s.user_id = ? AND e.payer_id != ? AND s.is_paid = 0) as borrowed
       FROM Groups g
       JOIN GroupMembers my ON my.group_id = g.id
       WHERE my.user_id = ?
       ORDER BY g.created_at DESC`,
    )
    .bind(userId, userId, userId, userId, userId)
    .all();

  const rows = (groups.results as Array<Record<string, unknown>>).map((g) => ({
    ...g,
    netBalance: (g.lent as number) - (g.borrowed as number),
  }));

  return c.json({ groups: rows });
});

/**
 * POST /api/groups/:id/members
 * Adds friends of the current user to a group. Only members can add others.
 */
groupRoutes.post(
  "/:id/members",
  zValidator("json", addMembersSchema),
  async (c) => {
    const groupId = c.req.param("id");
    const { userIds } = c.req.valid("json");
    const currentUser = c.get("user");
    const db = c.env.DB;

    // Verify the current user is a member of this group
    const membership = await db
      .prepare("SELECT 1 FROM GroupMembers WHERE group_id = ? AND user_id = ?")
      .bind(groupId, currentUser.userId)
      .first();
    if (!membership) {
      return c.json({ error: "You are not a member of this group" }, 403);
    }

    // Verify each target is the current user's friend (or self)
    for (const memberId of userIds) {
      if (memberId === currentUser.userId) continue;
      const isFriend = await db
        .prepare(
          `SELECT 1 FROM Friends
           WHERE (user_id_1 = ? AND user_id_2 = ?)
              OR (user_id_1 = ? AND user_id_2 = ?)`,
        )
        .bind(currentUser.userId, memberId, memberId, currentUser.userId)
        .first();
      if (!isFriend) {
        return c.json({ error: "You can only add friends to a group" }, 403);
      }
    }

    await db.batch(
      userIds.map((memberId) =>
        db
          .prepare(
            "INSERT OR IGNORE INTO GroupMembers (group_id, user_id) VALUES (?, ?)",
          )
          .bind(groupId, memberId),
      ),
    );

    return c.json({ message: "Members added" });
  },
);

/**
 * GET /api/groups/:id
 * Returns group details, members, financial insights, and expense history.
 */
groupRoutes.get("/:id", async (c) => {
  const groupId = c.req.param("id");
  const currentUser = c.get("user");
  const userId = currentUser.userId;
  const db = c.env.DB;

  // Verify membership
  const membership = await db
    .prepare("SELECT 1 FROM GroupMembers WHERE group_id = ? AND user_id = ?")
    .bind(groupId, userId)
    .first();
  if (!membership) {
    return c.json({ error: "You are not a member of this group" }, 403);
  }

  const group = await db
    .prepare(
      "SELECT id, name, description, created_by, created_at FROM Groups WHERE id = ?",
    )
    .bind(groupId)
    .first<{
      id: string;
      name: string;
      description: string | null;
      created_by: string;
      created_at: number;
    }>();

  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  const members = await db
    .prepare(
      `SELECT u.id, u.email, u.name
       FROM GroupMembers gm
       JOIN Users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY u.name COLLATE NOCASE`,
    )
    .bind(groupId)
    .all();

  // --- Insights ---

  // Total spent across all expenses in this group (by everyone)
  const totalGroupExpenditure = await db
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM Expenses WHERE group_id = ?",
    )
    .bind(groupId)
    .first<{ total: number }>();

  // The current user's total share in this group
  const individualExpenditure = await db
    .prepare(
      `SELECT COALESCE(SUM(s.amount_owed), 0) as total
       FROM ExpenseSplits s
       JOIN Expenses e ON s.expense_id = e.id
       WHERE e.group_id = ? AND s.user_id = ?`,
    )
    .bind(groupId, userId)
    .first<{ total: number }>();

  // What others still owe the current user within this group
  const lent = await db
    .prepare(
      `SELECT COALESCE(SUM(s.amount_owed), 0) as total
       FROM ExpenseSplits s
       JOIN Expenses e ON s.expense_id = e.id
       WHERE e.group_id = ? AND e.payer_id = ? AND s.user_id != ? AND s.is_paid = 0`,
    )
    .bind(groupId, userId, userId)
    .first<{ total: number }>();

  // What the current user still owes others within this group
  const borrowed = await db
    .prepare(
      `SELECT COALESCE(SUM(s.amount_owed), 0) as total
       FROM ExpenseSplits s
       JOIN Expenses e ON s.expense_id = e.id
       WHERE e.group_id = ? AND s.user_id = ? AND e.payer_id != ? AND s.is_paid = 0`,
    )
    .bind(groupId, userId, userId)
    .first<{ total: number }>();

  const lentTotal = lent?.total ?? 0;
  const borrowedTotal = borrowed?.total ?? 0;

  // --- Expenses ---
  const expenses = await db
    .prepare(
      `SELECT e.id, e.payer_id, e.amount, e.name, e.description, e.created_at,
              p.name as payer_name
       FROM Expenses e
       JOIN Users p ON e.payer_id = p.id
       WHERE e.group_id = ?
       ORDER BY e.created_at DESC`,
    )
    .bind(groupId)
    .all();

  const rows = expenses.results as Array<Record<string, unknown>>;

  // Batch-fetch tags for all returned expenses
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

  return c.json({
    ...group,
    members: members.results,
    insights: {
      totalGroupExpenditure: totalGroupExpenditure?.total ?? 0,
      individualExpenditure: individualExpenditure?.total ?? 0,
      lent: lentTotal,
      borrowed: borrowedTotal,
      netBalance: lentTotal - borrowedTotal,
    },
    expenses: rows,
  });
});
