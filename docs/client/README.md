# Client documentation

Next.js App Router frontend under `src/`. All game pages are client components where they use sockets.

## Routes

| Path | File | Purpose |
| ---- | ---- | ------- |
| `/` | `app/page.tsx` | Marketing landing |
| `/mendicot` | `app/mendicot/page.tsx` | Rules and how to play |
| `/mendicot/play` | `app/mendicot/play/page.tsx` | Lobby + game (main interactive page) |

`app/layout.tsx` — root fonts, dark theme. `globals.css` — Tailwind, felt table texture, glow utilities.

## Libraries

| File | Purpose |
| ---- | ------- |
| `lib/socket.ts` | Singleton Socket.IO client; `connectSocket` / `disconnectSocket` |
| `lib/useMediaQuery.ts` | SSR-safe breakpoint hook for compact table layout |
| `types/game.ts` | Shared types — **also imported by server** |

## Deep dives

- [components.md](./components.md) — UI component map
- [state-and-sockets.md](./state-and-sockets.md) — play page state machine, storage keys

## Styling conventions

- Tailwind 4, dark zinc/emerald felt aesthetic
- `felt-bg` class on game table (`globals.css`)
- Framer Motion for page transitions, card play, trick entry
- Mobile-first: `useMediaQuery("(max-width: 639.98px)")` toggles compact card sizes

## Client vs server validation

`GameBoard.tsx` defines `isValidCard` for highlighting playable cards. The server still rejects illegal plays. **Never** add client-only rule changes without matching `engine.ts`.

## Mobile browsers

The UI targets mobile Safari/Chrome in-browser play (not a native app). See [mobile.md](./mobile.md).

`NEXT_PUBLIC_SERVER_URL` is inlined at build time. Default behavior uses `window.location.origin`, which is correct for the unified `server.ts` deployment.
