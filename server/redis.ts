import Redis from "ioredis";
import type { ServerGameState, LobbyRoom } from "../src/types/game";

const ROOM_PREFIX = "mendicot:room:";
const ROOM_TTL = 3600; // 1 hour

let redis: Redis | null = null;
const fallbackStore = new Map<string, string>();
let usingFallback = false;

function getRedis(): Redis | null {
  if (usingFallback) return null;
  if (redis) return redis;

  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("[redis] Max retries reached, falling back to in-memory store");
          usingFallback = true;
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redis.on("error", (err) => {
      if (!usingFallback) {
        console.warn("[redis] Connection error, using in-memory fallback:", err.message);
        usingFallback = true;
        redis?.disconnect();
        redis = null;
      }
    });

    return redis;
  } catch {
    console.warn("[redis] Failed to create client, using in-memory fallback");
    usingFallback = true;
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
      console.warn("[redis] save failed, using fallback");
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
      console.warn("[redis] get failed, using fallback");
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
      console.warn("[redis] delete failed, using fallback");
    }
  }

  fallbackStore.delete(key);
}

export async function listRooms(): Promise<LobbyRoom[]> {
  const rooms: LobbyRoom[] = [];
  const client = getRedis();

  let keys: string[] = [];

  if (client && !usingFallback) {
    try {
      keys = await client.keys(ROOM_PREFIX + "*");
      for (const key of keys) {
        const json = await client.get(key);
        if (!json) continue;
        const state = JSON.parse(json) as ServerGameState;
        rooms.push(stateToLobbyRoom(state));
      }
      return rooms;
    } catch {
      console.warn("[redis] listRooms failed, using fallback");
    }
  }

  for (const [, json] of fallbackStore) {
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
