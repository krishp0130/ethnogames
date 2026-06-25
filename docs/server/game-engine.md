# Game engine (`server/game/engine.ts`)

Pure functions: input `ServerGameState` + action → output `ServerGameState` or throw. No sockets, no Redis.

## Play order

```ts
const PLAY_ORDER = [0, 3, 2, 1];  // counter-clockwise
```

`nextPlayer(i)` advances along this ring. First lead of a hand is `nextPlayer(dealerIndex)` (player to dealer's right).

## Exported functions

### `createRoom(roomId, hostPlayer)`

Creates lobby with one human host at seat 0, team 0, phase `waiting`.

### `addPlayer(state, { id, socketId, name })`

Appends human player. Throws if room full (4) or phase ≠ `waiting`. Team assigned by seat: `seatIndex % 2`.

### `addBot(state)`

Appends bot (`isBot: true`, empty `socketId`). Same capacity/phase guards as `addPlayer`.

### `startHand(state)`

Requires 4 players. Shuffles deck, deals 13 each (`dealCards`), sorts hands, resets trick/trump counters, sets phase `playing`, `trickNumber: 1`.

### `getValidCards(state, playerIndex)`

- Leading (empty trick): entire hand.
- Must follow `leadSuit` if any card of that suit in hand.
- Otherwise: any card (may establish trump).

Used by engine validation, AI, and mirrored loosely on client for highlights.

### `playCard(state, playerIndex, cardId)`

Main mutation. Validates turn, card ownership, and `getValidCards`. Updates trick, may set trump on first off-suit play, calls `resolveTrick` when 4 cards played.

Throws: wrong phase, wrong turn, card not in hand, invalid follow.

### `clearTrick(state)`

After `trick_complete` animation delay. Clears `currentTrick` and `leadSuit`, increments `trickNumber`, phase → `playing`. No-op if phase ≠ `trick_complete`.

### `toClientState(state, playerIndex)`

Returns `{ state: ClientGameState, hand: Card[] }`:

- Strips opponent hands → `cardCount`
- Hides `trumpSuit` until `trumpRevealed` (client sees `null` before reveal)
- Sets `myIndex` to requesting player

## Internal resolution

### `resolveTrick`

Compares cards: highest trump wins; else highest of lead suit. Updates `teamTricks`, `teamTens` (count rank `"10"` in trick). If 13 tricks completed → `resolveHand`; else phase `trick_complete`, winner leads next.

### `resolveHand`

Scoring priority:

1. All 13 tricks → `fifty_two`
2. All 4 tens → `mendikot`
3. 3+ tens → normal win for that team
4. 2-2 tens → team with more tricks wins

Increments `score[handWinner]`. Dealer rotation:

- Dealer's team won → deal passes right (`nextPlayer(dealerIndex)`)
- Dealer's team lost → dealer deals again **except** opponent `fifty_two` win → deal passes right

Phase → `game_over` if score ≥ `winningScore` (5), else `hand_complete`.

## Related: `deck.ts`

| Function | Purpose |
| -------- | ------- |
| `createDeck()` | 52 cards, ids `{rank}_{suit}` |
| `shuffleDeck()` | In-place Fisher-Yates copy |
| `dealCards()` | 5+4+4 per player, seat order 0-3 |
| `getRankValue()` | Index in `RANK_ORDER` (2 low, A high) |
| `sortHand()` | Suit order spades→clubs, then rank |

## Related: `ai.ts`

`aiSelectCard(state, playerIndex)` uses `getValidCards` then heuristics:

- **Lead:** high non-trump (A/K), or protected tens, or lowest trump if only trump left
- **Follow suit:** duck if partner winning; try to win tens tricks; dump lows
- **Off-suit:** partner winning → discard; else trump to capture tens or set trump from longest suit

Not optimal play — adequate for fill-in bots.
