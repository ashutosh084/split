import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Bindings, Variables } from "../types";
import { uuid } from "../utils/helpers";
import { createJwt } from "../utils/jwt";

// --- Schemas ---

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// --- Helpers ---

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Routes ---

export const authRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

/**
 * POST /api/auth/register
 * Creates a user with is_approved = 0.
 * The first registered user automatically becomes admin (is_admin = 1, is_approved = 1).
 */
authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  const db = c.env.DB;

  // Check if email already exists
  const existing = await db
    .prepare("SELECT id FROM Users WHERE email = ?")
    .bind(email)
    .first();

  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const id = uuid();
  const passwordHash = await hashPassword(password);

  // Determine if this is the first user (will be auto-admin)
  const userCount = await db
    .prepare("SELECT COUNT(*) as count FROM Users")
    .first<{ count: number }>();

  const isFirstUser = userCount?.count === 0;

  await db
    .prepare(
      "INSERT INTO Users (id, email, password_hash, name, is_approved, is_admin) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      email,
      passwordHash,
      name,
      isFirstUser ? 1 : 0,
      isFirstUser ? 1 : 0,
    )
    .run();

  return c.json(
    {
      message: isFirstUser
        ? "Admin account created. You may now log in."
        : "Registration successful. Await admin approval.",
    },
    201,
  );
});

/**
 * POST /api/auth/login
 * Rejects if is_approved == 0. Returns a Set-Cookie with JWT if approved.
 */
authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const db = c.env.DB;

  const user = await db
    .prepare(
      "SELECT id, email, password_hash, name, is_approved, is_admin FROM Users WHERE email = ?",
    )
    .bind(email)
    .first<{
      id: string;
      email: string;
      password_hash: string;
      name: string;
      is_approved: number;
      is_admin: number;
    }>();

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.password_hash) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  if (!user.is_approved) {
    return c.json({ error: "Account pending admin approval" }, 403);
  }

  const token = await createJwt(
    { userId: user.id, email: user.email, isAdmin: user.is_admin },
    c.env.JWT_SECRET,
  );

  // Set JWT as HTTP-only cookie
  c.header(
    "Set-Cookie",
    `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
  );

  return c.json({
    message: "Login successful",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: !!user.is_admin,
    },
    token, // also return token for Authorization header usage
  });
});

/**
 * POST /api/auth/logout
 * Clears the auth cookie.
 */
authRoutes.post("/logout", (c) => {
  c.header(
    "Set-Cookie",
    "auth_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
  );
  return c.json({ message: "Logged out" });
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user's info.
 */
authRoutes.get("/me", async (c) => {
  const { getAuthPayload } = await import("../utils/jwt");
  const payload = await getAuthPayload(c, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = c.env.DB;
  const user = await db
    .prepare("SELECT id, email, name, is_admin FROM Users WHERE id = ?")
    .bind(payload.userId)
    .first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
});
