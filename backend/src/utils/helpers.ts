/**
 * Generate a random UUID v4 (compatible with Cloudflare Workers).
 */
export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Get the current Unix timestamp in seconds.
 */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}
