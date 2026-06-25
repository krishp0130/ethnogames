# Socket layer (`server/gameSocket.ts`)

## Entry

`attachGameSocket(httpServer)` creates Socket.IO with CORS from `allowedOrigins` and registers connection handlers. Called once from `server.ts`.

## Concurrency: `withRoomLock`

Promise chain per `roomId` serializes overlapping events (double `add_bot`, concurrent `play_card`, etc.). Always use inside handlers that read-modify-write room state.

## In-memory maps (process-local)

| Map | Key → Value | Purpose |
| --- | ----------- | ------- |
| `socketRoomMap` | socket.id → roomId | Resolve room for events without payload |
| `roomLocks` | roomId → Promise chain | Mutex |

These do **not** survive restart and are not shared across instances — production scaling needs sticky sessions or external lock if multiple nodes.

## Client → Server handlers

| Event | Auth check | Engine / side effects |
| ----- | ---------- | --------------------- |
| `create_room` | — | `allocateUnusedRoomId`, `createRoom`, join socket room |
| `join_room` | room exists | `addPlayer`, lock |
| `rejoin_room` | playerId in room, not bot | Update socketId, lock |
| `add_bot` | socket in room | `addBot` |
| `start_game` | socket in room | `startHand`, then `playBotTurns` |
| `play_card` | socket maps to player | `playCard`, trump/trick timing, `playBotTurns` |
| `next_hand` | socket in room, phase `hand_complete` | `startHand`, bots |
| `new_game` | socket in room | Reset score/dealer, `startHand`, bots |
| `request_lobby` | — | `listRooms` |
| `disconnect` | was in room | Mark disconnected or delete room |

Room codes: normalized with `.trim().toUpperCase()`.

## Server → Client emits

| Event | Audience | Notes |
| ----- | -------- | ----- |
| `game_state` | Per-player socket | Personalized hand |
| `room_joined` | Initiating socket | Includes `playerId` for rejoin |
| `lobby_update` | Requester | Open rooms list |
| `trump_set` | `io.to(roomId)` | All in room |
| `trick_complete` | Room | Before `clearTrick` |
| `error` | Initiating socket | String message |

## Error handling

`errMessage(err, fallback)` prefers `Error.message`. Engine throws (e.g. "Not your turn") become client `error` events.

Silent no-ops: `next_hand` / `new_game` when phase wrong or room missing (no error emit).

## ID generation

- **Room:** 6-char alphanumeric uppercase, collision-checked up to 16 attempts
- **Player:** `player-{timestamp}-{random}`

## Bot loop caveats

- Runs outside the main handler await chain.
- Re-fetches room after trick delay before `clearTrick` (state may have changed).
- If room deleted mid-loop, exits quietly.

See [../decisions/known-issues.md](../decisions/known-issues.md) for disconnect-during-bot and multi-tab edge cases.
