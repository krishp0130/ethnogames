# Persistence (`server/redis.ts`)

## Key format

```
mendicot:room:{ROOM_ID}  → JSON.stringify(ServerGameState)
TTL: 3600 seconds (1 hour) on each save
```

## API

| Function | Behavior |
| -------- | -------- |
| `saveRoom(roomId, state)` | SET with EX TTL |
| `getRoom(roomId)` | GET + JSON.parse, or null |
| `deleteRoom(roomId)` | DEL |
| `listRooms()` | SCAN + pipeline GET → `LobbyRoom[]` |

## Fallback mode

If Redis client fails to connect or errors at runtime:

- `usingFallback = true` (sticky for process lifetime)
- All ops use in-memory `Map<string, string>`
- Console warns once per failure path

**Implication:** Dev works without Redis; prod should run Redis so rooms survive restarts and multi-instance deploys have a shared store (still need sticky sockets for in-memory maps in `gameSocket.ts`).

## Lobby room metadata

`stateToLobbyRoom` builds:

- `hostName` from `players[0]`
- `status`: `waiting` if phase `waiting`, else `in_progress`
- `createdAt`: `Date.now()` at list time (not true creation time — see known issues)

## Serialization notes

Full `ServerGameState` including all hands is stored server-side. Clients never see this blob directly.

No migration/version field on stored JSON — schema changes require careful rollout or room TTL expiry.
