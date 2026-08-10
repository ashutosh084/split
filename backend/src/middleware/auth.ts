import type { MiddlewareHandler } from "hono";
import type { Bindings, Variables } from "../types";
import { getAuthPayload } from "../utils/jwt";

/**
 * Middleware: require a valid JWT. Attaches the payload to `c.set("user", payload)`.
 */
export const authRequired: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = async (c, next) => {
  const payload = await getAuthPayload(c, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", payload);
  await next();
};

/**
 * Middleware: require the authenticated user to be an admin.
 * Must be used AFTER `authRequired`.
 */
export const adminRequired: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = async (c, next) => {
  const user = c.get("user");
  if (!user || !user.isAdmin) {
    return c.json({ error: "Forbidden: admin access required" }, 403);
  }
  await next();
};
