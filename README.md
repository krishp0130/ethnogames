# Ethnogames

Play traditional card games from around the world with friends and family — online, in real time.

## Games

### Mendicot (Mendikot)

A beloved Indian trick-taking card game for 4 players in 2 partnerships. Capture the Tens to win!

- **Players:** 4 (2v2 teams)
- **Deck:** Standard 52 cards
- **Trump:** Set dynamically when a player first can't follow suit
- **Win condition:** Capture 3+ Tens, or win more tricks when Tens are split 2-2

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Animations:** Framer Motion
- **Real-time:** Socket.IO (authoritative server model)
- **State:** Redis (game lobby and in-progress game state)
- **Server:** Node.js + Express

## Getting Started

### Prerequisites

- Node.js 20+
- Redis (optional — falls back to in-memory storage)

### Install

```bash
npm install
```

### Development

Run both the game server and Next.js frontend:

```bash
# Terminal 1 — Game server (port 3001)
npm run dev:server

# Terminal 2 — Frontend (port 3000)
npm run dev
```

Or run both together:

```bash
npm run dev:all
```

Then open [http://localhost:3000](http://localhost:3000).

### How to Play

1. Go to **Play Now** → enter your name → **Create Room**
2. Share the room code with friends, or click **Add Bot** to fill seats
3. Once 4 players are in, click **Start Game**
4. Play cards by clicking them — the server enforces all rules

## Architecture

The game uses an **authoritative server model**:

- All game logic runs on the server
- Clients send actions (`play_card`, `create_room`, etc.)
- The server validates moves and broadcasts state to all players
- Each player only receives their own hand; other players' cards are hidden
- Redis stores active game rooms with automatic TTL expiry

## Project Structure

```
├── src/                    # Next.js frontend
│   ├── app/
│   │   ├── page.tsx        # Landing page
│   │   ├── mendicot/
│   │   │   ├── page.tsx    # Mendicot rules & info
│   │   │   └── play/
│   │   │       └── page.tsx # Game lobby + board
│   ├── components/         # React components
│   ├── lib/                # Socket.IO client
│   └── types/              # Shared TypeScript types
├── server/                 # Game server
│   ├── index.ts            # Express + Socket.IO entry
│   ├── redis.ts            # Redis client with fallback
│   └── game/
│       ├── engine.ts       # Authoritative game engine
│       ├── deck.ts         # Deck utilities
│       └── ai.ts           # Bot AI
└── package.json
```
