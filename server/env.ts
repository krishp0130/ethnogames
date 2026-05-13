/**
 * Shared server configuration for Express + Socket.IO (CORS, bind address).
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

/** Build a CORS `origin` callback for a fixed allow-list */
export function createCorsOriginValidator(origins: string[]) {
  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ): void => {
    if (!origin) {
      callback(null, true);
      return;
    }
    callback(null, origins.includes(origin));
  };
}

export const corsOriginValidator = createCorsOriginValidator(allowedOrigins);
