# Known issues, gaps, and prior fixes

Document problems and solutions so future agents do not re-break fixed behavior or rediscover the same pitfalls.

## Fixed: dual-server dev setup (Express + Next)

**Problem:** Game server ran on port 3001 (`server/index.ts` + Express), Next on 3000. Required `dev:all`, separate CORS, and `NEXT_PUBLIC_SERVER_URL=http://localhost:3001`. Easy to run only one process and get silent connection failures.

**Solution (current, may be uncommitted):**

- Single entry `server.ts` — Next.js + Socket.IO on one HTTP server
- Handlers extracted to `server/gameSocket.ts`
- Removed `express`, `cors` dependencies
- Client `socket.ts` uses `window.location.origin` by default
- Scripts: `dev` → `tsx watch server.ts`, `start` → `tsx server.ts`

**Do not** reintroduce a second port without updating docs, CI, and `socket.ts`.

## Fixed: race conditions on room mutations

**Problem:** Concurrent `add_bot` or rapid `play_card` could corrupt room state.

**Solution:** `withRoomLock(roomId)` promise mutex in `gameSocket.ts`. All read-modify-write paths must use it.

## Fixed: Redis `KEYS` for lobby listing

**Problem:** `KEYS mendicot:room:*` blocks Redis at scale.

**Solution:** `SCAN` with `COUNT 200` + pipeline `GET` in `listRooms()`.

## Fixed: invalid card hover affordance

**Problem:** All cards in hand lifted on hover even when not playable — felt clickable but server rejected.

**Solution:** `PlayerHand` only applies hover lift when `isCurrentTurn && isValid` (`canLift`).

## Fixed: trick card overlap on small screens

**Problem:** Trick area cards overlapped visually on mobile.

**Solution:** `TrickArea` `LAYOUTS` with per-size `xOffset`/`yOffset` chosen so cross layout has no intersection; compact uses `md` not `lg`.

## Open: no auth / room hijacking

Anyone with a 6-character room code can join. `playerId` only helps **rejoin same seat**, not security. Acceptable for friends-and-family MVP; not for ranked play.

## Open: disconnected player mid-game

Player marked `isConnected: false` but seat retained. No auto-bot substitution, no turn timeout. Game can stall if disconnected player never returns.

## Open: `playBotTurns` error visibility

Bot loop catches errors and logs to console only. Clients may see frozen game with no `error` event.

## Open: multi-tab same player

Two tabs with same `sessionStorage` may fight over one `playerId`/socket. Last connect wins; other tab gets errors or stale state.

## Open: `createdAt` in lobby list

`stateToLobbyRoom` sets `createdAt: Date.now()` at list time, not actual room creation. Misleading for "sort by age" features.

## Open: room code collision

6-char base-36 codes — collision handled by retry (16 attempts) but not astronomically rare at scale. No rate limit on `create_room`.

## Open: horizontal scaling

- `socketRoomMap` and `roomLocks` are in-process only.
- Redis shares room JSON but Socket.IO rooms need sticky sessions or Redis adapter for multi-node.
- Bot loop assumes single writer per room (lock is local).

## Open: test coverage gaps

- No Socket.IO integration tests
- No AI behavior tests
- No client component tests
- `dealCards` order vs dealer-right deal convention not asserted in tests (deal goes seat 0→3 in batches; verify against house rules if rules disputes arise)

## Open: `trick_complete` client handler

Server emits `trick_complete` but client relies on `game_state` phase. Event is redundant today; safe to use for dedicated winner animation later.

## Open: production Redis fallback

If Redis dies mid-flight, process switches to in-memory forever (`usingFallback` sticky). Rooms on other instances won't sync. Monitor Redis and restart process on persistent errors.

## Open: README vs working tree

Root README may describe unified server while `main` branch still has dual-server layout until refactor is merged. Trust `server.ts` + `gameSocket.ts` presence as source of truth.

## Mendicot rules edge cases (verified in engine tests)

- Must follow suit when possible
- Trump set on first off-suit play in a trick (not on lead)
- 2-2 tens → most tricks wins
- Dealer rotation exceptions for fifty-two mendikot documented in engine

When changing rules, update `engine.test.ts`, root README rules section, and `app/mendicot/page.tsx` copy if user-facing.
