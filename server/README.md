# Server code

Game logic, Socket.IO handlers, and room persistence.

| Path | Purpose |
| ---- | ------- |
| `gameSocket.ts` | Socket.IO events (imported by `server.ts`) |
| `env.ts` | CORS allow-list from env |
| `redis.ts` | Room storage |
| `game/engine.ts` | Mendicot rules |
| `game/deck.ts` | Deck utilities |
| `game/ai.ts` | Bot AI |

**Agent documentation:** [../docs/server/README.md](../docs/server/README.md)

Entry point is **`../server.ts`** at repo root (not this folder).
