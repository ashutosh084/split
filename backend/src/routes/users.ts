import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { authRequired } from "../middleware/auth";

export const userRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// All user routes require authentication
userRoutes.use("*", authRequired);

/**
 * GET /api/users/me/dashboard
 * Returns aggregated financial data:
 * - totalSpent: sum of all splits for this user
 * - iOwe: total unpaid splits where someone else paid
 * - othersOweMe: total unpaid splits where current user paid
 * - tagBreakdown: spending grouped by tag
 */
userRoutes.get("/me/dashboard", async (c) => {
  const currentUser = c.get("user");
  const db = c.env.DB;
  const userId = currentUser.userId;

  // Total cash out (all splits attributed to this user)
  const totalSpent = await db
    .prepare(
      "SELECT COALESCE(SUM(amount_owed), 0) as total FROM ExpenseSplits WHERE user_id = ?",
    )
    .bind(userId)
    .first<{ total: number }>();

  // What I owe (unpaid splits where I'm NOT the payer)
  const iOwe = await db
    .prepare(
      `SELECT COALESCE(SUM(s.amount_owed), 0) as total
       FROM ExpenseSplits s
       JOIN Expenses e ON s.expense_id = e.id
       WHERE s.user_id = ? AND s.is_paid = 0 AND e.payer_id != ?`,
    )
    .bind(userId, userId)
    .first<{ total: number }>();

  // What others owe me (unpaid splits where I AM the payer, but it's not my own split)
  const othersOweMe = await db
    .prepare(
      `SELECT COALESCE(SUM(s.amount_owed), 0) as total
       FROM ExpenseSplits s
       JOIN Expenses e ON s.expense_id = e.id
       WHERE e.payer_id = ? AND s.is_paid = 0 AND s.user_id != ?`,
    )
    .bind(userId, userId)
    .first<{ total: number }>();

  return c.json({
    totalSpent: totalSpent?.total ?? 0,
    iOwe: iOwe?.total ?? 0,
    othersOweMe: othersOweMe?.total ?? 0,
    netBalance: (othersOweMe?.total ?? 0) - (iOwe?.total ?? 0),
  });
});

/**
 * GET /api/users/me/tags
 * Returns aggregated spending grouped by tag for the current user.
 */
userRoutes.get("/me/tags", async (c) => {
  const currentUser = c.get("user");
  const db = c.env.DB;
  const userId = currentUser.userId;

  const tagBreakdown = await db
    .prepare(
      `SELECT t.name, COALESCE(SUM(s.amount_owed), 0) as total
       FROM ExpenseSplits s
       JOIN ExpenseTags et ON s.expense_id = et.expense_id
       JOIN Tags t ON et.tag_id = t.id
       WHERE s.user_id = ?
       GROUP BY t.name
       ORDER BY total DESC`,
    )
    .bind(userId)
    .all();

  return c.json({ tags: tagBreakdown.results });
});

/**
 * GET /api/users/search?q=<query>
 * Search for users by name or email (for adding friends or splitting).
 */
userRoutes.get("/search", async (c) => {
  const q = c.req.query("q") || "";
  const db = c.env.DB;

  if (q.length < 2) {
    return c.json({ users: [] });
  }

  const users = await db
    .prepare(
      "SELECT id, email, name FROM Users WHERE (name LIKE ? OR email LIKE ?) AND is_approved = 1 LIMIT 20",
    )
    .bind(`%${q}%`, `%${q}%`)
    .all();

  return c.json({ users: users.results });
});
