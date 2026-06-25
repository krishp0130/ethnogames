# Agent guide — Ethnogames

Start here when working on this repository. Human-oriented docs live in the root [README.md](../README.md); this file is optimized for **future agents** and maintainers.

## What this project is

Ethnogames is a real-time multiplayer card game platform. The first game is **Mendicot** (Indian trick-taking, 4 players, 2 teams). The stack is Next.js 16 + React 19 (frontend), Socket.IO (real-time), and a custom Node entry (`server.ts`) that serves both the site and game sockets on one port.

## Read order

| Order | Document | When to read |
| ----- | -------- | ------------ |
| 1 | [architecture/overview.md](./architecture/overview.md) | Any change — understand the authoritative-server model |
| 2 | [architecture/data-flow.md](./architecture/data-flow.md) | Socket events, state sync, bot turns |
| 3 | [server/README.md](./server/README.md) | Backend / game rules / Redis |
| 4 | [client/README.md](./client/README.md) | UI, lobby, game board |
| 5 | [decisions/known-issues.md](./decisions/known-issues.md) | Bugs, gaps, prior fixes — **read before refactoring** |
| 6 | [decisions/changelog-and-migrations.md](./decisions/changelog-and-migrations.md) | Historical architecture changes |
| 7 | [decisions/production-checklist.md](./decisions/production-checklist.md) | Deploy / ops work |

## Directory map

```
ethnogames/
├── server.ts              # Process entry: Next.js HTTP + /health + Socket.IO attach
├── server/
│   ├── gameSocket.ts      # All Socket.IO event handlers
│   ├── env.ts             # CLIENT_ORIGINS / CORS allow-list
│   ├── redis.ts           # Room persistence (Redis + in-memory fallback)
│   └── game/
│       ├── engine.ts      # Authoritative Mendicot rules (pure functions)
│       ├── deck.ts        # Deck, shuffle, deal, rank helpers
│       └── ai.ts          # Bot card selection
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # Lobby, GameBoard, cards, score UI
│   ├── lib/               # Socket client singleton, useMediaQuery
│   └── types/game.ts      # Shared types + Socket.IO event typings
├── docs/                  # Agent-oriented documentation (you are here)
└── .codegraph/            # Local CodeGraph index (gitignored) — see codegraph.md
```

## Golden rules

1. **Server is authoritative** — Clients emit actions (`play_card`); only `server/game/engine.ts` decides legality and updates state. Client `isValidCard` in `GameBoard.tsx` is UI-only.
2. **Types are shared** — `src/types/game.ts` is imported by both `src/` and `server/`. Keep client and server shapes in sync here.
3. **Per-room locking** — All room mutations in `gameSocket.ts` go through `withRoomLock(roomId, …)` to avoid races.
4. **Personalized broadcasts** — `toClientState(state, playerIndex)` strips opponent hands before `game_state` emit.
5. **Tests target pure logic** — Vitest runs `server/**/*.test.ts`. No socket integration tests yet.
6. **Single process in prod** — `npm run dev` / `npm run start` run `tsx server.ts`, not a separate game server port.

## Common tasks

| Task | Primary files |
| ---- | ------------- |
| Change Mendicot rules | `server/game/engine.ts`, `server/game/engine.test.ts` |
| Add socket event | `src/types/game.ts`, `server/gameSocket.ts`, client handler in `play/page.tsx` or components |
| Lobby / room UX | `src/components/Lobby.tsx` |
| Card table layout | `src/components/GameBoard.tsx`, `PlayerHand.tsx`, `TrickArea.tsx` |
| Bot behavior | `server/game/ai.ts` |
| CORS / origins | `server/env.ts`, env vars `CLIENT_ORIGINS` |
| Room storage / TTL | `server/redis.ts` |
| Deploy | [decisions/production-checklist.md](./decisions/production-checklist.md) |

## Skills

- **[vercel-react-best-practices](.agents/skills/vercel-react-best-practices)** — React/Next.js performance rules from Vercel Engineering. Use when reviewing or refactoring frontend code.
- **[web-design-guidelines](.agents/skills/web-design-guidelines)** — Vercel Web Interface Guidelines (a11y, forms, focus, motion).
- **[vercel-composition-patterns](.agents/skills/vercel-composition-patterns)** — Component composition (compound components, avoid boolean prop proliferation).

## Verification commands

```bash
npm run lint
npm run test
npm run build
npm run dev    # http://localhost:3000 — site + sockets same origin
```

CI (`.github/workflows/ci.yml`) runs the same lint, test, and build on PRs to `main`.

## CodeGraph

See [codegraph.md](./codegraph.md). Local graph data lives in `.codegraph/` and is not committed.
