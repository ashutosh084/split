import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings, Variables } from "./types";
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { friendRoutes } from "./routes/friends";
import { expenseRoutes } from "./routes/expenses";
import { userRoutes } from "./routes/users";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS — restrict to the frontend origin
app.use("*", async (c, next) => {
  const origin = c.env.CORS_ORIGIN || "http://localhost:3000";
  const corsMiddleware = cors({
    origin,
    credentials: true,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  });
  return corsMiddleware(c, next);
});

// Health check
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Mount routes
app.route("/api/auth", authRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/friends", friendRoutes);
app.route("/api/expenses", expenseRoutes);
app.route("/api/users", userRoutes);

export default app;
