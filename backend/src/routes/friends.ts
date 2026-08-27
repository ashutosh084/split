import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Bindings, Variables } from "../types";
import { authRequired } from "../middleware/auth";
import { uuid, now } from "../utils/helpers";

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
 * Sends a friend request. No longer auto-bidirectional — the other user must accept.
 */
friendRoutes.post("/", zValidator("json", addFriendSchema), async (c) => {
  const { friendEmail } = c.req.valid("json");
  const currentUser = c.get("user");
  const db = c.env.DB;

  // Find the target user by email
  const target = await db
    .prepare("SELECT id, email, name FROM Users WHERE email = ?")
    .bind(friendEmail)
    .first<{ id: string; email: string; name: string }>();

  if (!target) {
    return c.json({ error: "User not found" }, 404);
  }

  if (target.id === currentUser.userId) {
    return c.json({ error: "Cannot add yourself as a friend" }, 400);
  }

  // Check if already friends
  const existingFriendship = await db
    .prepare(
      "SELECT * FROM Friends WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)",
    )
    .bind(currentUser.userId, target.id, target.id, currentUser.userId)
    .first();

  if (existingFriendship) {
    return c.json({ error: "Already friends" }, 409);
  }

  // Check for an existing request (pending or otherwise) in either direction
  const existingRequest = await db
    .prepare(
      `SELECT * FROM FriendRequests
       WHERE (from_user_id = ? AND to_user_id = ?)
          OR (from_user_id = ? AND to_user_id = ?)`,
    )
    .bind(currentUser.userId, target.id, target.id, currentUser.userId)
    .first<{ id: string; from_user_id: string; status: string }>();

  if (existingRequest) {
    if (existingRequest.status === "pending") {
      if (existingRequest.from_user_id === currentUser.userId) {
        return c.json({ error: "Friend request already sent" }, 409);
      }
      // The other user already sent YOU a request — auto-accept it
      await db
        .prepare("DELETE FROM FriendRequests WHERE id = ?")
        .bind(existingRequest.id)
        .run();
      await db
        .prepare("INSERT INTO Friends (user_id_1, user_id_2) VALUES (?, ?)")
        .bind(currentUser.userId, target.id)
        .run();
      return c.json(
        {
          message: "Friend request accepted — you both sent requests!",
          friend: { id: target.id, email: target.email, name: target.name },
        },
        201,
      );
    }
    // Rejected or previously processed — allow re-sending
    await db
      .prepare("DELETE FROM FriendRequests WHERE id = ?")
      .bind(existingRequest.id)
      .run();
  }

  // Create a pending friend request
  const requestId = uuid();
  await db
    .prepare(
      "INSERT INTO FriendRequests (id, from_user_id, to_user_id, status, created_at) VALUES (?, ?, ?, 'pending', ?)",
    )
    .bind(requestId, currentUser.userId, target.id, now())
    .run();

  return c.json(
    {
      message: "Friend request sent",
      requestId,
      recipient: { id: target.id, email: target.email, name: target.name },
    },
    201,
  );
});

/**
 * GET /api/friends
 * Lists all accepted friends of the current user.
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

// --- Friend Request Endpoints ---

/**
 * GET /api/friends/requests/incoming
 * Lists pending friend requests sent TO the current user.
 */
friendRoutes.get("/requests/incoming", async (c) => {
  const currentUser = c.get("user");
  const db = c.env.DB;

  const requests = await db
    .prepare(
      `SELECT fr.id, fr.from_user_id, fr.to_user_id, fr.status, fr.created_at,
              u.name as from_name, u.email as from_email
       FROM FriendRequests fr
       INNER JOIN Users u ON u.id = fr.from_user_id
       WHERE fr.to_user_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
    )
    .bind(currentUser.userId)
    .all();

  return c.json({ requests: requests.results });
});

/**
 * GET /api/friends/requests/outgoing
 * Lists pending friend requests sent BY the current user.
 */
friendRoutes.get("/requests/outgoing", async (c) => {
  const currentUser = c.get("user");
  const db = c.env.DB;

  const requests = await db
    .prepare(
      `SELECT fr.id, fr.from_user_id, fr.to_user_id, fr.status, fr.created_at,
              u.name as to_name, u.email as to_email
       FROM FriendRequests fr
       INNER JOIN Users u ON u.id = fr.to_user_id
       WHERE fr.from_user_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
    )
    .bind(currentUser.userId)
    .all();

  return c.json({ requests: requests.results });
});

/**
 * POST /api/friends/requests/:id/accept
 * Accepts a pending incoming friend request. Creates the bidirectional friendship.
 */
friendRoutes.post("/requests/:id/accept", async (c) => {
  const requestId = c.req.param("id");
  const currentUser = c.get("user");
  const db = c.env.DB;

  const req = await db
    .prepare("SELECT * FROM FriendRequests WHERE id = ?")
    .bind(requestId)
    .first<{
      id: string;
      from_user_id: string;
      to_user_id: string;
      status: string;
    }>();

  if (!req) {
    return c.json({ error: "Request not found" }, 404);
  }

  if (req.to_user_id !== currentUser.userId) {
    return c.json({ error: "This request is not for you" }, 403);
  }

  if (req.status !== "pending") {
    return c.json({ error: `Request is already ${req.status}` }, 400);
  }

  // Create bidirectional friendship
  await db
    .prepare("INSERT INTO Friends (user_id_1, user_id_2) VALUES (?, ?)")
    .bind(req.from_user_id, req.to_user_id)
    .run();

  // Mark request as accepted
  await db
    .prepare("UPDATE FriendRequests SET status = 'accepted' WHERE id = ?")
    .bind(requestId)
    .run();

  return c.json({ message: "Friend request accepted" });
});

/**
 * POST /api/friends/requests/:id/reject
 * Rejects a pending incoming friend request.
 */
friendRoutes.post("/requests/:id/reject", async (c) => {
  const requestId = c.req.param("id");
  const currentUser = c.get("user");
  const db = c.env.DB;

  const req = await db
    .prepare("SELECT * FROM FriendRequests WHERE id = ?")
    .bind(requestId)
    .first<{
      id: string;
      from_user_id: string;
      to_user_id: string;
      status: string;
    }>();

  if (!req) {
    return c.json({ error: "Request not found" }, 404);
  }

  if (req.to_user_id !== currentUser.userId) {
    return c.json({ error: "This request is not for you" }, 403);
  }

  if (req.status !== "pending") {
    return c.json({ error: `Request is already ${req.status}` }, 400);
  }

  await db
    .prepare("UPDATE FriendRequests SET status = 'rejected' WHERE id = ?")
    .bind(requestId)
    .run();

  return c.json({ message: "Friend request rejected" });
});
