/**
 * Shared server configuration for Socket.IO CORS allow-list.
 */

function expandOriginVariants(origins: string[]): string[] {
  const expanded = new Set(origins);

  for (const origin of origins) {
    try {
      const url = new URL(origin);
      const { protocol, hostname } = url;
      if (hostname.startsWith("www.")) {
        expanded.add(`${protocol}//${hostname.slice(4)}`);
      } else {
        expanded.add(`${protocol}//www.${hostname}`);
      }
    } catch {
      // Ignore malformed entries.
    }
  }

  return [...expanded];
}

export function parseClientOriginsFromEnv(
  env: NodeJS.ProcessEnv
): string[] {
  const raw =
    env.CLIENT_ORIGINS?.trim() ||
    env.CORS_ORIGINS?.trim() ||
    "";
  if (raw) {
    const origins = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return expandOriginVariants(origins);
  }
  return ["http://localhost:3000"];
}

export const allowedOrigins = parseClientOriginsFromEnv(process.env);
