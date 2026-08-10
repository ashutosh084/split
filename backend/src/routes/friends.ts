import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Bindings, Variables } from "../types";
import { authRequired } from "../middleware/auth";
import { uuid } from "../utils/helpers";

const addFriendSchema = z.object({
  friendEmail: z.string().email(),
});

export const friendRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// All friend routes require authentication
friendRoutes.use("*", authRequired);

/**
 * POST /api/friends
 * Adds a bidirectional friendship between the current user and the target user.
 */
friendRoutes.post("/", zValidator("json", addFriendSchema), async (c) => {
  const { friendEmail } = c.req.valid("json");
  const currentUser = c.get("user");
  const db = c.env.DB;

  // Find the friend by email
  const friend = await db
    .prepare("SELECT id, email, name FROM Users WHERE email = ?")
    .bind(friendEmail)
    .first<{ id: string; email: string; name: string }>();

  if (!friend) {
    return c.json({ error: "User not found" }, 404);
  }

  if (friend.id === currentUser.userId) {
    return c.json({ error: "Cannot add yourself as a friend" }, 400);
  }

  // Check if friendship already exists
  const existing = await db
    .prepare(
      "SELECT * FROM Friends WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)",
    )
    .bind(currentUser.userId, friend.id, friend.id, currentUser.userId)
    .first();

  if (existing) {
    return c.json({ error: "Already friends" }, 409);
  }

  // Insert bidirectional record
  await db
    .prepare("INSERT INTO Friends (user_id_1, user_id_2) VALUES (?, ?)")
    .bind(currentUser.userId, friend.id)
    .run();

  return c.json(
    {
      message: "Friend added",
      friend: { id: friend.id, email: friend.email, name: friend.name },
    },
    201,
  );
});

/**
 * GET /api/friends
 * Lists all friends of the current user.
 */
friendRoutes.get("/", async (c) => {
  const currentUser = c.get("user");
  const db = c.env.DB;

  const friends = await db
    .prepare(
      `SELECT u.id, u.email, u.name
       FROM Users u
       INNER JOIN Friends f ON (f.user_id_1 = u.id OR f.user_id_2 = u.id)
       WHERE (f.user_id_1 = ? OR f.user_id_2 = ?) AND u.id != ?`,
    )
    .bind(currentUser.userId, currentUser.userId, currentUser.userId)
    .all();

  return c.json({ friends: friends.results });
});
