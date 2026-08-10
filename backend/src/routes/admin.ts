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
