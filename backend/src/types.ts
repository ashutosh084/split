import type { JwtPayload } from "./utils/jwt";

/**
 * Shared Hono bindings and variables for the Split API.
 */

export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
};

export type Variables = {
  user: JwtPayload;
};
