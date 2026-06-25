/**
 * Shared server configuration for Socket.IO CORS allow-list.
 */

export function parseClientOriginsFromEnv(
  env: NodeJS.ProcessEnv
): string[] {
  const raw =
    env.CLIENT_ORIGINS?.trim() ||
    env.CORS_ORIGINS?.trim() ||
    "";
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return ["http://localhost:3000"];
}

export const allowedOrigins = parseClientOriginsFromEnv(process.env);
