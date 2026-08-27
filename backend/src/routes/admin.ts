import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { authRequired, adminRequired } from "../middleware/auth";

export const adminRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// All admin routes require authentication + admin role
adminRoutes.use("*", authRequired, adminRequired);

/**
 * GET /api/admin/users/pending
 * Lists all users awaiting admin approval (is_approved = 0).
 */
adminRoutes.get("/users/pending", async (c) => {
  const db = c.env.DB;

  const users = await db
    .prepare(
      "SELECT id, email, name, is_approved, is_admin FROM Users WHERE is_approved = 0",
    )
    .all();

  return c.json({ users: users.results });
});

/**
 * PATCH /api/admin/users/:id/approve
 * Approves a pending user by setting is_approved = 1.
 */
adminRoutes.patch("/users/:id/approve", async (c) => {
  const userId = c.req.param("id");
  const db = c.env.DB;

  const user = await db
    .prepare("SELECT id, is_approved FROM Users WHERE id = ?")
    .bind(userId)
    .first<{ id: string; is_approved: number }>();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  if (user.is_approved) {
    return c.json({ error: "User is already approved" }, 400);
  }

  await db
    .prepare("UPDATE Users SET is_approved = 1 WHERE id = ?")
    .bind(userId)
    .run();

  return c.json({ message: "User approved successfully" });
});

/**
 * GET /api/admin/users
 * Lists all users (for admin management).
 */
adminRoutes.get("/users", async (c) => {
  const db = c.env.DB;

  const users = await db
    .prepare(
      "SELECT id, email, name, is_approved, is_admin FROM Users ORDER BY name",
    )
    .all();

  return c.json({ users: users.results });
});

/**
 * DELETE /api/admin/users/:id
 * Removes a user. Only allowed if the user has no pending (unpaid) amounts.
 * "Pending" means any ExpenseSplit where is_paid = 0 and the user is either
 * the debtor (user_id) or the creditor (payer of the expense).
 */
adminRoutes.delete("/users/:id", async (c) => {
  const userId = c.req.param("id");
  const db = c.env.DB;

  // Prevent self-deletion
  const currentUser = c.get("user");
  if (currentUser.userId === userId) {
    return c.json({ error: "You cannot remove yourself" }, 400);
  }

  // Verify the user exists
  const user = await db
    .prepare("SELECT id, is_admin FROM Users WHERE id = ?")
    .bind(userId)
    .first<{ id: string; is_admin: number }>();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Check for pending amounts: user owes someone (unpaid splits where user is debtor)
  const debtCheck = await db
    .prepare(
      "SELECT COUNT(*) as cnt FROM ExpenseSplits WHERE user_id = ? AND is_paid = 0",
    )
    .bind(userId)
    .first<{ cnt: number }>();

  // Check for pending amounts: someone owes this user (unpaid splits on expenses they paid)
  const creditCheck = await db
    .prepare(
      `SELECT COUNT(*) as cnt
       FROM ExpenseSplits es
       JOIN Expenses e ON es.expense_id = e.id
       WHERE e.payer_id = ? AND es.is_paid = 0 AND es.user_id != ?`,
    )
    .bind(userId, userId)
    .first<{ cnt: number }>();

  if (debtCheck!.cnt > 0 || creditCheck!.cnt > 0) {
    return c.json(
      { error: "Cannot remove user: they have pending (unsettled) balances" },
      400,
    );
  }

  // Clean up related records, then delete the user
  await db.batch([
    db
      .prepare(
        "DELETE FROM ExpenseTags WHERE expense_id IN (SELECT id FROM Expenses WHERE payer_id = ?)",
      )
      .bind(userId),
    db
      .prepare(
        "DELETE FROM ExpenseSplits WHERE expense_id IN (SELECT id FROM Expenses WHERE payer_id = ?)",
      )
      .bind(userId),
    db.prepare("DELETE FROM ExpenseSplits WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM Expenses WHERE payer_id = ?").bind(userId),
    db
      .prepare("DELETE FROM Friends WHERE user_id_1 = ? OR user_id_2 = ?")
      .bind(userId, userId),
    db.prepare("DELETE FROM Users WHERE id = ?").bind(userId),
  ]);

  return c.json({ message: "User removed successfully" });
});
