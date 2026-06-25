# Server documentation

Backend code lives under `server/` and is bootstrapped from `server.ts` at the repo root.

## File reference

| File | Role |
| ---- | ---- |
| `server.ts` | Creates HTTP server, Next.js handler, `/health`, calls `attachGameSocket` |
| `gameSocket.ts` | Socket.IO server, event handlers, room locks, bot loop |
| `env.ts` | `parseClientOriginsFromEnv`, `allowedOrigins` for Socket.IO CORS |
| `redis.ts` | `saveRoom`, `getRoom`, `deleteRoom`, `listRooms` |
| `game/engine.ts` | Mendicot rules — pure state transitions |
| `game/deck.ts` | Deck creation, Fisher-Yates shuffle, 5-4-4 deal, sorting |
| `game/ai.ts` | `aiSelectCard` — heuristic bot |
| `tsconfig.json` | Server TS config (tests and imports from `src/types`) |

## Deep dives

- [game-engine.md](./game-engine.md) — every exported engine function
- [socket-layer.md](./socket-layer.md) — handlers, locking, errors
- [persistence.md](./persistence.md) — Redis keys, fallback, lobby scan

## Environment

| Variable | Used by | Notes |
| -------- | ------- | ----- |
| `PORT`, `HOST` | `server.ts` | Default `3000`, `0.0.0.0` |
| `NODE_ENV` | Next.js | `production` for `npm run start` after build |
| `CLIENT_ORIGINS` / `CORS_ORIGINS` | `env.ts` | Socket.IO CORS |
| `REDIS_URL` or `REDIS_HOST`+`REDIS_PORT` | `redis.ts` | Optional; memory fallback if unavailable |

## Tests

```bash
npm run test   # server/env.test.ts, server/game/*.test.ts
```

Engine tests construct minimal `ServerGameState` fixtures — good templates for new rule tests.

## Adding a new game (future)

Today everything is Mendicot-specific (`mendicot:room:` prefix, single engine). A second game would likely need:

- Namespaced Redis keys and room types
- Game-specific engine module
- Separate socket namespace or `gameType` on room state
- New route under `src/app/<game>/`

Do not bolt multiple rule sets into `engine.ts` without a clear module boundary.
