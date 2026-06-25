import Redis from "ioredis";
import type { ServerGameState, LobbyRoom } from "../src/types/game";

const ROOM_PREFIX = "mendicot:room:";
const ROOM_TTL = 3600; // 1 hour

let redis: Redis | null = null;
const fallbackStore = new Map<string, string>();
/** In-memory when Redis is not configured, or after a connection failure. */
let usingFallback = false;
let loggedMemoryMode = false;
let loggedRedisFailure = false;

function isRedisConfigured(): boolean {
  if (process.env.REDIS_URL?.trim()) return true;
  if (process.env.REDIS_HOST?.trim()) return true;
  if (process.env.REDIS_PORT?.trim()) return true;
  return false;
}

function logMemoryModeOnce(): void {
  if (loggedMemoryMode) return;
  loggedMemoryMode = true;
  console.log(
    "[redis] Using in-memory store (set REDIS_URL to enable Redis persistence)"
  );
}

function switchToFallback(reason: string): void {
  usingFallback = true;
  if (redis) {
    redis.disconnect();
    redis = null;
  }
  if (!loggedRedisFailure) {
    loggedRedisFailure = true;
    console.warn(`[redis] ${reason}`);
  }
}

/** @internal Force in-memory storage (for unit tests without Redis). */
export function resetRedisStorageForTests(): void {
  fallbackStore.clear();
  usingFallback = true;
  loggedMemoryMode = false;
  loggedRedisFailure = false;
  if (redis) {
    redis.disconnect();
    redis = null;
  }
}

async function scanKeys(client: Redis, pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [next, batch] = await client.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      200
    );
    cursor = next;
    keys.push(...batch);
  } while (cursor !== "0");
  return keys;
}

function getRedis(): Redis | null {
  if (usingFallback) return null;
  if (!isRedisConfigured()) {
    logMemoryModeOnce();
    return null;
  }
  if (redis) return redis;

  try {
    const url = process.env.REDIS_URL?.trim();
    const common = {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy(times: number) {
        if (times > 3) {
          switchToFallback(
            "Max retries reached, falling back to in-memory store"
          );
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    } as const;

    redis = url
      ? new Redis(url, common)
      : new Redis({
          host: process.env.REDIS_HOST || "127.0.0.1",
          port: parseInt(process.env.REDIS_PORT || "6379", 10),
          ...common,
        });

    redis.on("error", (err) => {
      if (!usingFallback) {
        switchToFallback(
          `Connection error, using in-memory fallback: ${err.message}`
        );
      }
    });

    return redis;
  } catch {
    switchToFallback("Failed to create client, using in-memory fallback");
    return null;
  }
}

export async function saveRoom(
  roomId: string,
  state: ServerGameState
): Promise<void> {
  const key = ROOM_PREFIX + roomId;
  const json = JSON.stringify(state);
  const client = getRedis();

  if (client && !usingFallback) {
    try {
      await client.set(key, json, "EX", ROOM_TTL);
      return;
    } catch {
      switchToFallback("save failed, using in-memory fallback");
    }
  }

  fallbackStore.set(key, json);
}

export async function getRoom(
  roomId: string
): Promise<ServerGameState | null> {
  const key = ROOM_PREFIX + roomId;
  const client = getRedis();

  if (client && !usingFallback) {
    try {
      const json = await client.get(key);
      return json ? (JSON.parse(json) as ServerGameState) : null;
    } catch {
      switchToFallback("get failed, using in-memory fallback");
    }
  }

  const json = fallbackStore.get(key);
  return json ? (JSON.parse(json) as ServerGameState) : null;
}

export async function deleteRoom(roomId: string): Promise<void> {
  const key = ROOM_PREFIX + roomId;
  const client = getRedis();

  if (client && !usingFallback) {
    try {
      await client.del(key);
      return;
    } catch {
      switchToFallback("delete failed, using in-memory fallback");
    }
  }

  fallbackStore.delete(key);
}

export async function listRooms(): Promise<LobbyRoom[]> {
  const rooms: LobbyRoom[] = [];
  const client = getRedis();

  if (client && !usingFallback) {
    try {
      const keys = await scanKeys(client, ROOM_PREFIX + "*");
      if (keys.length === 0) return [];

      const pipeline = client.pipeline();
      for (const key of keys) {
        pipeline.get(key);
      }
      const results = await pipeline.exec();
      if (!results) return rooms;

      for (const [, json] of results) {
        if (typeof json !== "string" || !json) continue;
        const state = JSON.parse(json) as ServerGameState;
        rooms.push(stateToLobbyRoom(state));
      }
      return rooms;
    } catch {
      switchToFallback("listRooms failed, using in-memory fallback");
    }
  }

  for (const [key, json] of fallbackStore) {
    if (!key.startsWith(ROOM_PREFIX)) continue;
    const state = JSON.parse(json) as ServerGameState;
    rooms.push(stateToLobbyRoom(state));
  }
  return rooms;
}

function stateToLobbyRoom(state: ServerGameState): LobbyRoom {
  return {
    roomId: state.roomId,
    hostName: state.players[0]?.name ?? "Unknown",
    playerCount: state.players.length,
    maxPlayers: 4,
    status: state.phase === "waiting" ? "waiting" : "in_progress",
    createdAt: Date.now(),
  };
}
