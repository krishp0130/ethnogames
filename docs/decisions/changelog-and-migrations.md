# Changelog and migrations (agent reference)

Human git history is the canonical log; this file captures **architectural** changes agents care about.

## Initial game (commit era: Mendicot multiplayer)

- Added Mendicot with authoritative `server/game/engine.ts`
- Express + Socket.IO game server separate from Next.js
- Redis with in-memory fallback
- Client at `/mendicot/play` with lobby, bots, animations

## Production readiness PR (#1)

- Vitest for engine, deck, env
- GitHub Actions CI: lint, test, build
- Session rejoin via `rejoin_room` + `sessionStorage`
- Per-room mutex, Redis SCAN for lobby
- Mobile UX fixes (PlayerHand, TrickArea, GameBoard)
- Expanded README (deployment, env vars, protocol)

## Single-server consolidation (in progress / local)

**Motivation:** Simpler dev UX, one deployable unit, no cross-origin socket setup for default case.

| Before | After |
| ------ | ----- |
| `server/index.ts` (Express, port 3001) | `server/gameSocket.ts` + `server.ts` |
| `npm run dev` + `dev:server` / `dev:all` | `npm run dev` only |
| `NEXT_PUBLIC_SERVER_URL` → `:3001` | Same origin default |
| Express `/health` on game server | `GET /health` on unified server |
| `cors` + `createCorsOriginValidator` | Socket.IO CORS only via `allowedOrigins` |

Deleted files: `server/index.ts`

New files: `server.ts`, `server/gameSocket.ts`

**Migration checklist for agents finishing this work:**

- [ ] Ensure `package-lock.json` synced (`npm install` after removing express/cors)
- [ ] Verify `npm run build && npm run start` serves pages and sockets
- [ ] Update deployment docs if platform expected two services
- [ ] Remove any stale env docs referencing port 3001

## CodeGraph setup

Added `.codegraph/.gitignore` so local graph index (DB, daemon pid, sockets) is never committed. Intended for IDE code navigation via CodeGraph MCP — data is per-machine.

No graph schema or generated docs are checked into the repo.

## Planned / not started

- User accounts and match history (Postgres mentioned in README as future)
- Additional games (Rummy, Teen Patti) — need routing and engine isolation
- Socket.IO Redis adapter for multi-instance

See [production-checklist.md](./production-checklist.md).
