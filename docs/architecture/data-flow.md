# Data flow — sockets, state, and bots

## Connection lifecycle

1. User opens `/mendicot/play`.
2. `play/page.tsx` calls `connectSocket()` (`src/lib/socket.ts`).
3. Socket URL resolves to `NEXT_PUBLIC_SERVER_URL` or `window.location.origin` (same port as Next.js).
4. On `connect`, page may emit `rejoin_room` from `sessionStorage` key `ethnogames_mendicot_session`.
5. Lobby flows: `create_room` / `join_room` → server emits `room_joined` + `game_state`.

## State sync pattern

Every mutation path in `gameSocket.ts` follows:

```
withRoomLock(roomId) → getRoom → engine fn → saveRoom (inside broadcastGameState) → emit
```

`broadcastGameState`:

1. `saveRoom(state.roomId, state)`
2. For each human player with `socketId`, `toClientState(state, i)` → emit `game_state` to that socket only

Bots have no socket; they are driven server-side.

## Human plays a card

```
Client: play_card(cardId)
  → gameSocket: withRoomLock
  → playCard(state, playerIndex, cardId)   // engine.ts
  → if trump newly revealed: io.to(roomId).emit("trump_set", ...)
  → if trick complete (4 cards):
       broadcastGameState
       emit trick_complete
       delay 1200ms
       clearTrick(state)
       broadcastGameState
       playBotTurns(roomId)   // if next turn may be bot
  → else: broadcastGameState, maybe playBotTurns
```

## Bot turn loop

`playBotTurns(roomId)` in `gameSocket.ts`:

- Waits **800ms** between bot actions (UX pacing).
- Under room lock: if current player `isBot`, `aiSelectCard` → `playCard`.
- Same trump / trick_complete / hand_complete handling as human path.
- Loops until a human's turn or hand/game end.

**Important:** `playBotTurns` is fire-and-forget (not awaited from handlers). Errors are logged, not surfaced to clients.

## Trick animation timing

| Delay | Where | Purpose |
| ----- | ----- | ------- |
| 800ms | Bot loop | Pause before bot plays |
| 1200ms | After trick_complete | Let clients show 4 cards before `clearTrick` |

Client listens to `trick_complete` indirectly via `game_state` phase `trick_complete`; cards stay visible until server clears trick.

## Disconnect / rejoin

**Disconnect** (`gameSocket.ts`):

- Clear `socketRoomMap` entry.
- Mark player `isConnected: false`.
- If all humans disconnected (bots don't count), `deleteRoom`.
- Else broadcast updated state with disconnect message.

**Rejoin** (`rejoin_room`):

- Match `playerId` in room; update `socketId`, `isConnected: true`.
- Reject if player is a bot slot.
- Client stores `{ roomId, playerId }` in `sessionStorage` on `room_joined` / `game_state`.

## Lobby listing

`request_lobby` → `listRooms()`:

- Redis: `SCAN` with pattern `mendicot:room:*` (not `KEYS`), pipeline `GET`s.
- Fallback: iterate in-memory `Map`.
- Maps each room to `LobbyRoom` (host name, player count, waiting vs in_progress).

## Phase machine (server)

| Phase | Meaning |
| ----- | ------- |
| `waiting` | Lobby, <4 players or not started |
| `playing` | Hand in progress |
| `trick_complete` | 4 cards played; waiting for `clearTrick` |
| `hand_complete` | 13 tricks done; scores updated |
| `game_over` | A team reached `winningScore` |

Client transitions `inGame` when `phase !== "waiting"` (`play/page.tsx`).
