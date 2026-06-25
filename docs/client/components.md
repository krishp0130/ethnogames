# UI components (`src/components/`)

## Component map

| Component | File | Responsibility |
| --------- | ---- | -------------- |
| `Navbar` | `Navbar.tsx` | Site nav, active route highlight |
| `Lobby` | `Lobby.tsx` | Create/join/browse rooms, waiting room, bots, start |
| `GameBoard` | `GameBoard.tsx` | Table layout, score strip, hand/trick orchestration, end-of-hand overlays |
| `PlayerHand` | `PlayerHand.tsx` | Fanned hand per seat; face-down backs for opponents |
| `PlayingCard` | `PlayingCard.tsx` | Single card UI (sizes sm/md/lg), motion, face-down back |
| `TrickArea` | `TrickArea.tsx` | Center trick cross layout, trump badge, play animations |
| `ScoreBoard` | `ScoreBoard.tsx` | Desktop sidebar scores, tricks, tens, dealer |

## Layout model

`GameBoard` maps absolute seats using **relative position** from local player:

```
relativePos = (seatIndex - myIndex + 4) % 4
POSITIONS = ["bottom", "right", "top", "left"]
```

Seat 0 is always the local player at the bottom; partner at top; opponents left/right.

## `PlayingCard` props (key)

| Prop | Effect |
| ---- | ------ |
| `size` | `sm` / `md` / `lg` dimensions |
| `faceDown` | Blue card back (opponents) |
| `highlighted` | Amber border when playable |
| `disabled` | Grayed when turn but can't play |
| `suppressWhileHover` | Parent `PlayerHand` handles hover lift in fan |
| `layoutId` | Framer shared layout for hand → trick (optional) |
| `animate` | `false` on trick cards to avoid double animation |

## `PlayerHand` — mobile layout

- `compact` prop reduces card size and fan overlap (`overlapForFan` math).
- Only **valid** cards get hover lift (`canLift = isCurrentTurn && isValid`) — intentional UX fix so illegal cards don't animate as playable.
- Horizontal hands (top/bottom) use negative `marginLeft` overlap; vertical use `marginTop`.

## `TrickArea` — geometry

`LAYOUTS` per card size define `xOffset` / `yOffset` so four trick cards form a non-overlapping cross. Entry animations slide from each seat direction (`entryFor`).

Trump pill renders above center when `trumpRevealed && trumpSuit`.

## `Lobby` views

State machine: `menu` | `browse` | `waiting`

- Name persisted in `localStorage` key `ethnogames_name`
- `waiting` requires `waitingState` from parent (`game_state` with phase `waiting`)
- Browse filters `status === "waiting"` only

## `ScoreBoard`

Desktop only (`hidden lg:block` in GameBoard). Mobile uses inline score strip in `GameBoard`.

Progress bars assume win at 5 points (hardcoded `/ 5` in UI — matches server `winningScore`).
