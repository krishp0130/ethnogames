# Client state and sockets

## Play page (`src/app/mendicot/play/page.tsx`)

Central client controller for Mendicot multiplayer.

### React state

| State | Type | Purpose |
| ----- | ---- | ------- |
| `socket` | `GameSocket \| null` | Socket.IO instance |
| `connected` | boolean | Connection indicator |
| `gameState` | `ClientGameState \| null` | Latest server view |
| `hand` | `Card[]` | Local player's cards (separate arg from `game_state`) |
| `inGame` | boolean | `true` when phase ≠ `waiting` — shows GameBoard vs Lobby |

### Session storage

Key: `ethnogames_mendicot_session`

```json
{ "roomId": "ABC123", "playerId": "player-..." }
```

Written on `room_joined` and `game_state`. Used for `rejoin_room` after refresh.

On rejoin errors (`Room not found`, `Player not found`, etc.), storage is cleared.

### Socket listeners (mount effect)

| Event | Handler |
| ----- | ------- |
| `connect` | `tryRejoin()`, set connected |
| `disconnect` | clear connected |
| `game_state` | update state + hand, set inGame, persist session |
| `room_joined` | persist session |
| `error` | clear session if rejoin failed |

Cleanup: removes listeners, calls `disconnectSocket()`.

### UI flow

```
!connected → spinner
connected && !inGame → Lobby (may have waitingState)
connected && inGame → GameBoard
```

## Socket client (`src/lib/socket.ts`)

- **Singleton** — one socket per page load
- `autoConnect: false` until `connectSocket()`
- Transports: `websocket`, `polling` fallback
- URL resolution order:
  1. `NEXT_PUBLIC_SERVER_URL`
  2. `window.location.origin`
  3. `http://localhost:3000` (SSR/build fallback)

### Prior architecture (fixed)

Previously defaulted to `http://localhost:3001` for a **separate Express game server**. Unified `server.ts` serves sockets on the same port as Next.js — client now uses same origin. See [../decisions/changelog-and-migrations.md](../decisions/changelog-and-migrations.md).

## Events not handled on client

These are server-emitted but have **no dedicated UI listener** today:

- `trick_complete` — state already updates via `game_state`; no extra animation hook
- `trump_set` — trump shown from `game_state.trumpSuit` / ScoreBoard

Adding celebratory UX could subscribe in `GameBoard` without protocol changes.

## Local storage keys

| Key | Set by | Purpose |
| --- | ------ | ------- |
| `ethnogames_name` | Lobby | Pre-fill player name |
| `ethnogames_mendicot_session` | Play page | Rejoin after refresh |
