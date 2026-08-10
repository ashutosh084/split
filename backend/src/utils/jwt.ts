import { SignJWT, jwtVerify } from "jose";
import type { Context } from "hono";

export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: number;
}

const alg = "HS256";

/**
 * Create a JWT for a given user payload.
 */
export async function createJwt(
  payload: JwtPayload,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(encoder.encode(secret));
}

/**
 * Verify and decode a JWT string. Returns the payload or null.
 */
export async function verifyJwt(
  token: string,
  secret: string,
): Promise<JwtPayload | null> {
  try {
    const encoder = new TextEncoder();
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract the JWT from the Authorization header (Bearer scheme)
 * or from the "auth_token" cookie.
 */
export function extractToken(c: Context): string | null {
  // Check Authorization header first
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Fall back to cookie
  const cookie = c.req.header("Cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Get the authenticated user payload from the request context,
 * or return null if not authenticated.
 */
export async function getAuthPayload(
  c: Context,
  secret: string,
): Promise<JwtPayload | null> {
  const token = extractToken(c);
  if (!token) return null;
  return verifyJwt(token, secret);
}
