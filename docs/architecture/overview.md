# Architecture overview

## High-level model

Ethnogames uses an **authoritative server** pattern:

- The browser renders state and sends **intent** (create room, play card).
- The server validates, mutates `ServerGameState`, persists to Redis (or memory), and pushes **personalized** updates to each connected human.

```
┌─────────────────────────────────────────────────────────────────┐
│                        server.ts (one process)                   │
│  HTTP: Next.js pages + GET /health                               │
│  WebSocket: Socket.IO via attachGameSocket()                     │
└─────────────────────────────────────────────────────────────────┘
         ▲                              │
         │ Socket.IO                    │ saveRoom / getRoom
         │                              ▼
┌────────┴────────┐              ┌──────────────┐
│  Next.js client │              │ Redis (TTL)  │
│  src/app,       │              │ or in-memory │
│  components     │              │ Map fallback │
└─────────────────┘              └──────────────┘
```

## Layer responsibilities

| Layer | Location | Responsibility |
| ----- | -------- | -------------- |
| Entry | `server.ts` | Boot Next.js, health check, attach Socket.IO |
| Transport | `server/gameSocket.ts` | Events, room locks, bot loop, broadcast |
| Rules | `server/game/engine.ts` | Pure game logic — no I/O |
| Persistence | `server/redis.ts` | JSON serialize rooms, lobby listing |
| Types | `src/types/game.ts` | Contracts between client and server |
| UI | `src/components/*` | Lobby, table, animations — no rule enforcement |

## Mendicot-specific conventions

- **4 seats**, teams `0` and `1` by `seatIndex % 2` (partners across the table).
- **Play order** is counter-clockwise: `0 → 3 → 2 → 1` (see `PLAY_ORDER` in `engine.ts`).
- **Trump (hukum)** is set on the first off-suit play in a hand, not at deal time.
- **Win game** at 5 points (`winningScore` on server state).

## Security posture (current)

- No authentication — rooms are gated by 6-character codes and stable `playerId` for rejoin.
- Opponent cards are never sent to clients (`toClientState` exposes `cardCount` only).
- Illegal plays throw in `engine.ts`; `gameSocket.ts` catches and emits `error`.
- CORS is restricted via `CLIENT_ORIGINS` for Socket.IO handshakes.

## What is intentionally not built yet

- User accounts, match history, replays
- Spectators
- Horizontal scaling / sticky sessions (single Node instance assumed)
- Integration tests for Socket.IO
- Rate limiting on room creation

See [../decisions/known-issues.md](../decisions/known-issues.md) for gaps and workarounds.
