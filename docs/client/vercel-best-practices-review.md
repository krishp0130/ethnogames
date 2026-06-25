# Frontend production review (Vercel React Best Practices)

Applied [vercel-react-best-practices](.agents/skills/vercel-react-best-practices) to the `src/` frontend.

## Changes made

| Rule | Change |
| ---- | ------ |
| `bundle-dynamic-imports` | Marketing pages and play route lazy-load Framer Motion / game UI via `next/dynamic` |
| `rerender-derived-state-no-effect` | `inGame` derived from `gameState.phase` instead of `useState` + effect |
| `client-localstorage-schema` | Versioned keys in `src/lib/storage.ts` with legacy migration |
| `rerender-lazy-state-init` | Lobby loads player name via `useState(() => loadPlayerName())` |
| `js-set-map-lookups` | `validCardIds` is a `Set` for O(1) playability checks |
| `rerender-memo` | `PlayerHand` and `PlayingCard` wrapped in `React.memo` |
| Rejoin UX fix | Lobby derives `activeView` / `roomId` from `waitingState` (no effect) |

## Component status

| File | Notes |
| ---- | ----- |
| `app/layout.tsx` | Server component — fonts hoisted at module level ✓ |
| `app/page.tsx` | Server shell + dynamic marketing content ✓ |
| `app/mendicot/page.tsx` | Server shell + dynamic rules content ✓ |
| `app/mendicot/play/page.tsx` | Dynamic Lobby/GameBoard; derived `inGame` ✓ |
| `components/Navbar.tsx` | Client (pathname) — lightweight ✓ |
| `components/Lobby.tsx` | Versioned storage; rejoin waiting room fix ✓ |
| `components/GameBoard.tsx` | `useMemo` for valid cards + seat order ✓ |
| `components/PlayerHand.tsx` | Memo + Set lookups ✓ |
| `components/PlayingCard.tsx` | Memo ✓ |
| `components/TrickArea.tsx` | Layout constants hoisted; `useMediaQuery` SSR-safe ✓ |
| `components/ScoreBoard.tsx` | Presentational — OK as-is |
| `lib/socket.ts` | Singleton init-once pattern ✓ |
| `lib/useMediaQuery.ts` | SSR-safe (false until mount) ✓ |
| `lib/storage.ts` | Versioned browser storage ✓ |

## Remaining opportunities (not blocking MVP)

- `rendering-resource-hints` — preload `/mendicot/play` on landing CTA hover
- `client-swr-dedup` — N/A (Socket.IO, not REST)
- Socket.IO still in play page bundle — acceptable; only loaded on that route
- No React `Activity` / Suspense streaming for game state (real-time socket model)

Re-run this review after major UI changes: invoke `/vercel-react-best-practices` in Agent chat.
