# Ethnogames

Play traditional card games from around the world with friends and family — online, in real time. No downloads, no sign-ups.

---

## Table of Contents

- [Games](#games)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Socket.IO Protocol](#socketio-protocol)
- [Game Rules: Mendicot](#game-rules-mendicot)
- [Environment Variables](#environment-variables)
- [Scripts Reference](#scripts-reference)
- [Contributing](#contributing)

---

## Games

### Mendicot (Mendikot)

A beloved Indian trick-taking card game for 4 players in 2 partnerships. Capture the Tens to win!

| Detail         | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| **Players**    | 4 (2 teams of 2, partners sit across)                       |
| **Deck**       | Standard 52 cards                                            |
| **Card Rank**  | A (high), K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2 (low)       |
| **Trump**      | Set dynamically — first off-suit card played becomes trump   |
| **Win a hand** | Capture 3+ Tens, or more tricks when Tens are split 2-2     |
| **Win game**   | First team to 5 points                                       |

*More games coming soon: Rummy, Teen Patti, and others.*

---

## Tech Stack

| Layer          | Technology                                |
| -------------- | ----------------------------------------- |
| **Frontend**   | Next.js 16, React 19, TypeScript          |
| **Styling**    | Tailwind CSS 4                            |
| **Animations** | Framer Motion                             |
| **Real-time**  | Socket.IO (WebSocket + polling fallback)  |
| **Server**     | Node.js, Express 5                        |
| **State**      | Redis (with automatic in-memory fallback) |
| **Dev tools**  | tsx (TypeScript execution), ESLint         |

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **Redis** (optional — the server falls back to in-memory storage automatically if Redis is not available)

### Installation

```bash
git clone https://github.com/krishp0130/ethnogames.git
cd ethnogames
npm install
```

### Running in Development

You need two processes: the game server (Socket.IO + Express) and the Next.js frontend.

```bash
# Terminal 1 — Game server (port 3001, hot-reloads on file changes)
npm run dev:server

# Terminal 2 — Next.js frontend (port 3000)
npm run dev
```

Or run both in a single terminal:

```bash
npm run dev:all
```

Then open [http://localhost:3000](http://localhost:3000).

### Playing a Game

1. Navigate to **Play Now** (or go directly to `/mendicot/play`)
2. Enter your name and click **Create Room**
3. Share the 6-character room code with friends — they enter it on the same page to join
4. Click **Add Bot** to fill any empty seats with AI players
5. Once all 4 seats are filled, click **Start Game**
6. Play cards by clicking them — highlighted cards are your valid moves
7. The server enforces all rules; you cannot make an illegal play

---

## Architecture

The application follows an **authoritative server model** — all game logic executes on the server. The client is a thin rendering layer.

```
┌──────────────┐     Socket.IO      ┌──────────────────────┐
│   Browser     │ ◄──────────────► │   Game Server (:3001) │
│   (Next.js)   │   play_card       │   ┌────────────────┐ │
│               │   game_state      │   │  Game Engine    │ │
│  - Lobby UI   │   trick_complete  │   │  (engine.ts)    │ │
│  - Game Board │   trump_set       │   ├────────────────┤ │
│  - Animations │                   │   │  Bot AI         │ │
│               │                   │   │  (ai.ts)        │ │
└──────────────┘                   │   ├────────────────┤ │
                                    │   │  Redis / Memory │ │
                                    │   │  (redis.ts)     │ │
                                    │   └────────────────┘ │
                                    └──────────────────────┘
```

### Key Design Decisions

- **Server-authoritative**: Clients send actions (e.g. `play_card`), the server validates them against the game rules, updates state, and broadcasts the result. Clients never compute game state themselves. This prevents cheating and ensures consistency.

- **Personalized state**: Each player receives a tailored view of the game. They see their own hand but only card counts for opponents. The server calls `toClientState(state, playerIndex)` to strip hidden information before sending.

- **Per-room mutex**: A promise-based lock serializes all state mutations for a given room. This prevents race conditions when multiple Socket.IO events arrive concurrently (e.g. two "add bot" clicks in rapid succession).

- **Redis with fallback**: Game rooms are stored in Redis with a 1-hour TTL for automatic cleanup. If Redis is unavailable, the server transparently falls back to an in-memory `Map`. No configuration needed — it just works.

- **Bot auto-play**: When it's a bot's turn, the server waits 800ms then plays a card automatically, looping until a human player's turn or end of hand. Bot logic lives in `ai.ts` and includes strategic decisions about leading, following suit, trumping, and protecting Tens.

---

## Project Structure

```
ethnogames/
├── src/                            # Next.js frontend
│   ├── app/
│   │   ├── page.tsx                # Landing page — game showcase, features
│   │   ├── layout.tsx              # Root layout with fonts and dark theme
│   │   ├── globals.css             # Tailwind imports, felt texture, animations
│   │   └── mendicot/
│   │       ├── page.tsx            # Mendicot rules, how-to-play, key concepts
│   │       └── play/
│   │           └── page.tsx        # Game lobby + board (main play page)
│   ├── components/
│   │   ├── Navbar.tsx              # Site navigation with active route highlighting
│   │   ├── Lobby.tsx               # Room creation, browsing, joining, bot management
│   │   ├── GameBoard.tsx           # Main game table — orchestrates all game UI
│   │   ├── PlayerHand.tsx          # Renders a player's cards (face-up or face-down)
│   │   ├── PlayingCard.tsx         # Single card with Framer Motion hover/play animations
│   │   ├── TrickArea.tsx           # Center of table — cards animate in from each seat
│   │   └── ScoreBoard.tsx          # Team scores, trick count, tens, trump indicator
│   ├── lib/
│   │   └── socket.ts              # Socket.IO client singleton (connect/disconnect)
│   └── types/
│       └── game.ts                # Shared types used by both client and server
│
├── server/                         # Game server (runs independently from Next.js)
│   ├── index.ts                    # Express + Socket.IO entry point, event handlers
│   ├── redis.ts                    # Redis client with in-memory fallback
│   ├── tsconfig.json               # Server-specific TypeScript config
│   └── game/
│       ├── engine.ts               # Authoritative game engine — all Mendicot rules
│       ├── deck.ts                 # Deck creation, shuffle, deal, sort, rank utilities
│       └── ai.ts                   # Bot AI — strategic card selection
│
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # Frontend TypeScript config
├── next.config.ts                  # Next.js configuration
├── postcss.config.mjs              # PostCSS with Tailwind
├── eslint.config.mjs               # ESLint configuration
└── README.md
```

---

## Socket.IO Protocol

All communication between client and server happens over Socket.IO. The types are defined in `src/types/game.ts`.

### Client → Server Events

| Event            | Payload                          | Description                                |
| ---------------- | -------------------------------- | ------------------------------------------ |
| `create_room`    | `playerName: string`             | Create a new room, join as host             |
| `join_room`      | `roomId: string, playerName: string` | Join an existing room by code          |
| `add_bot`        | *(none)*                         | Add an AI bot to the current room           |
| `start_game`     | *(none)*                         | Deal cards and start playing                |
| `play_card`      | `cardId: string`                 | Play a card (server validates legality)     |
| `next_hand`      | *(none)*                         | Start the next hand after one completes     |
| `new_game`       | *(none)*                         | Reset scores and start a fresh game         |
| `request_lobby`  | *(none)*                         | Request list of open rooms                  |

### Server → Client Events

| Event            | Payload                              | Description                                          |
| ---------------- | ------------------------------------ | ---------------------------------------------------- |
| `game_state`     | `state: ClientGameState, hand: Card[]` | Full game state update (personalized per player)   |
| `room_joined`    | `roomId: string, playerIndex: number`| Confirmation that the player joined a room           |
| `lobby_update`   | `rooms: LobbyRoom[]`                | List of available rooms                              |
| `trick_complete` | `trick: TrickCard[], winnerIndex: number` | A trick was won — shown before clearing cards   |
| `trump_set`      | `suit: Suit, playerName: string`     | Trump suit was just established                      |
| `error`          | `message: string`                    | Error message (invalid move, room full, etc.)        |

---

## Game Rules: Mendicot

### Overview

Mendicot (also spelled Mendikot) is a trick-taking card game from India for exactly 4 players in fixed partnerships. Partners sit across from each other.

### Deal

The dealer shuffles a standard 52-card deck and deals 13 cards to each player in counter-clockwise order, in batches of 5, then 4, then 4.

### Play

1. The player to the dealer's right leads the first trick
2. Play proceeds **counter-clockwise** (seat order: 0 → 3 → 2 → 1)
3. Players **must follow the suit led** if they have a card of that suit
4. If a player cannot follow suit, they may play any card

### Trump (Hukum)

There is **no trump suit at the start** of a hand. The very first time any player cannot follow suit, the card they play establishes the **trump suit (hukum)** for the remainder of that hand.

### Winning a Trick

- If any trump cards were played, the **highest trump** wins
- Otherwise, the **highest card of the suit led** wins
- The trick winner leads the next trick

### Scoring a Hand

After all 13 tricks are played, count which team captured the four Tens:

| Condition                           | Result                      |
| ----------------------------------- | --------------------------- |
| One team captures **3 or 4 Tens**   | That team wins (1 point)    |
| One team captures **all 4 Tens**    | **Mendikot** (1 point)      |
| One team wins **all 13 tricks**     | **52-Card Mendikot** (1 pt) |
| Each team has **2 Tens**            | Most tricks wins (1 point)  |

### Winning the Game

First team to reach **5 points** wins.

### Dealer Rotation

- If the **dealer's team wins**, the deal passes to the next player to the dealer's right
- If the **dealer's team loses**, the dealer deals again
- Exception: if the opponents win by **52-Card Mendikot**, the deal still rotates

---

## Environment Variables

All optional — the app works with zero configuration.

| Variable                  | Default                  | Description                          |
| ------------------------- | ------------------------ | ------------------------------------ |
| `PORT`                    | `3001`                   | Game server port                     |
| `REDIS_HOST`              | `127.0.0.1`              | Redis host                           |
| `REDIS_PORT`              | `6379`                   | Redis port                           |
| `NEXT_PUBLIC_SERVER_URL`  | `http://localhost:3001`  | Socket.IO server URL (for frontend)  |

---

## Scripts Reference

| Script             | Command                         | Description                                   |
| ------------------ | ------------------------------- | --------------------------------------------- |
| `npm run dev`      | `next dev`                      | Start Next.js in development mode (port 3000) |
| `npm run dev:server` | `tsx watch server/index.ts`   | Start game server with hot reload (port 3001) |
| `npm run dev:all`  | Both of the above in parallel   | Start everything in one terminal              |
| `npm run build`    | `next build`                    | Production build of the frontend              |
| `npm run start`    | `next start`                    | Serve the production frontend build           |
| `npm run start:server` | `tsx server/index.ts`       | Start game server without hot reload          |
| `npm run lint`     | `eslint`                        | Run ESLint across the project                 |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-game`)
3. Make your changes
4. Ensure `npm run build` passes and `npm run lint` is clean
5. Commit and push
6. Open a pull request

---

Built with care for the games we grew up playing.
