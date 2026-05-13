import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { allowedOrigins, corsOriginValidator } from "./env";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  ServerGameState,
} from "../src/types/game";
import {
  createRoom,
  addPlayer,
  addBot,
  startHand,
  playCard,
  clearTrick,
  toClientState,
} from "./game/engine";
import { aiSelectCard } from "./game/ai";
import { saveRoom, getRoom, deleteRoom, listRooms } from "./redis";

const app = express();
app.use(cors({ origin: corsOriginValidator, credentials: true }));
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "ethnogames-game" });
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Maps socket ID → roomId for quick lookup on disconnect
const socketRoomMap = new Map<string, string>();

// Per-room mutex to serialize state mutations and prevent race conditions
const roomLocks = new Map<string, Promise<void>>();

async function withRoomLock<T>(roomId: string, fn: () => Promise<T>): Promise<T> {
  const prev = roomLocks.get(roomId) ?? Promise.resolve();
  let resolve: () => void;
  const next = new Promise<void>((r) => { resolve = r; });
  roomLocks.set(roomId, next);
  await prev;
  try {
    return await fn();
  } finally {
    resolve!();
  }
}

function errMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function allocateUnusedRoomId(): Promise<string> {
  for (let attempt = 0; attempt < 16; attempt++) {
    const roomId = generateRoomId();
    const existing = await getRoom(roomId);
    if (!existing) return roomId;
  }
  throw new Error("Could not allocate a room code");
}

function generatePlayerId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

/** Send each player in the room their personalized game state. */
async function broadcastGameState(state: ServerGameState): Promise<void> {
  await saveRoom(state.roomId, state);

  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i];
    if (player.isBot || !player.socketId) continue;

    const { state: clientState, hand } = toClientState(state, i);
    io.to(player.socketId).emit("game_state", clientState, hand);
  }
}

/** Automatically play bot turns with delays. */
async function playBotTurns(roomId: string): Promise<void> {
  try {
    let keepGoing = true;
    while (keepGoing) {
      await delay(800);

      keepGoing = await withRoomLock(roomId, async () => {
        let state = await getRoom(roomId);
        if (!state || state.phase !== "playing") return false;

        const current = state.players[state.currentPlayerIndex];
        if (!current?.isBot) return false;

        console.log(`[bot] ${current.name} (seat ${state.currentPlayerIndex}) playing...`);
        const card = aiSelectCard(state, state.currentPlayerIndex);
        console.log(`[bot] ${current.name} plays ${card.rank} of ${card.suit}`);

        const prevTrumpRevealed = state.trumpRevealed;
        state = playCard(state, state.currentPlayerIndex, card.id);

        if (!prevTrumpRevealed && state.trumpRevealed && state.trumpSuit) {
          io.to(roomId).emit("trump_set", state.trumpSuit, current.name);
        }

        if (state.phase === "trick_complete") {
          await broadcastGameState(state);
          io.to(roomId).emit("trick_complete", state.currentTrick, state.currentPlayerIndex);

          await delay(1200);

          state = await getRoom(roomId);
          if (!state) return false;
          state = clearTrick(state);
          await broadcastGameState(state);
          return true;
        }

        if (state.phase === "hand_complete" || state.phase === "game_over") {
          await broadcastGameState(state);
          return false;
        }

        await broadcastGameState(state);
        return true;
      });
    }
  } catch (err) {
    console.error(`[bot] error in playBotTurns for room ${roomId}:`, err);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on("create_room", async (playerName) => {
    try {
      const roomId = await allocateUnusedRoomId();
      const playerId = generatePlayerId();

      const state = createRoom(roomId, {
        id: playerId,
        socketId: socket.id,
        name: playerName,
      });

      await saveRoom(roomId, state);
      socket.join(roomId);
      socketRoomMap.set(socket.id, roomId);

      socket.emit("room_joined", roomId, 0, playerId);
      await broadcastGameState(state);
    } catch (err) {
      socket.emit("error", errMessage(err, "Failed to create room"));
    }
  });

  socket.on("join_room", async (roomIdRaw, playerName) => {
    try {
      const roomId = roomIdRaw.trim().toUpperCase();
      await withRoomLock(roomId, async () => {
        let state = await getRoom(roomId);
        if (!state) {
          socket.emit("error", "Room not found");
          return;
        }

        const playerId = generatePlayerId();
        const playerIndex = state.players.length;

        state = addPlayer(state, {
          id: playerId,
          socketId: socket.id,
          name: playerName,
        });

        socket.join(roomId);
        socketRoomMap.set(socket.id, roomId);

        socket.emit("room_joined", roomId, playerIndex, playerId);
        await broadcastGameState(state);
      });
    } catch (err) {
      socket.emit("error", errMessage(err, "Failed to join room"));
    }
  });

  socket.on("rejoin_room", async (roomIdRaw, playerId) => {
    try {
      const roomId = roomIdRaw.trim().toUpperCase();
      if (!roomId || !playerId) {
        socket.emit("error", "Invalid rejoin");
        return;
      }

      await withRoomLock(roomId, async () => {
        let state = await getRoom(roomId);
        if (!state) {
          socket.emit("error", "Room not found");
          return;
        }

        const playerIndex = state.players.findIndex((p) => p.id === playerId);
        if (playerIndex === -1) {
          socket.emit("error", "Player not found in room");
          return;
        }

        const target = state.players[playerIndex];
        if (target.isBot) {
          socket.emit("error", "Invalid rejoin");
          return;
        }

        const players = state.players.map((p, i) =>
          i === playerIndex
            ? { ...p, socketId: socket.id, isConnected: true }
            : p
        );

        state = { ...state, players };
        await saveRoom(roomId, state);

        socket.join(roomId);
        socketRoomMap.set(socket.id, roomId);

        socket.emit("room_joined", roomId, playerIndex, playerId);
        await broadcastGameState(state);
      });
    } catch (err) {
      socket.emit("error", errMessage(err, "Failed to rejoin room"));
    }
  });

  socket.on("add_bot", async () => {
    try {
      const roomId = socketRoomMap.get(socket.id);
      if (!roomId) {
        socket.emit("error", "Not in a room");
        return;
      }

      await withRoomLock(roomId, async () => {
        let state = await getRoom(roomId);
        if (!state) {
          socket.emit("error", "Room not found");
          return;
        }

        state = addBot(state);
        await broadcastGameState(state);
      });
    } catch (err) {
      socket.emit("error", errMessage(err, "Failed to add bot"));
    }
  });

  socket.on("start_game", async () => {
    try {
      const roomId = socketRoomMap.get(socket.id);
      if (!roomId) {
        socket.emit("error", "Not in a room");
        return;
      }

      await withRoomLock(roomId, async () => {
        let state = await getRoom(roomId);
        if (!state) {
          socket.emit("error", "Room not found");
          return;
        }

        state = startHand(state);
        await broadcastGameState(state);
      });

      playBotTurns(roomId);
    } catch (err) {
      socket.emit("error", errMessage(err, "Failed to start game"));
    }
  });

  socket.on("play_card", async (cardId) => {
    try {
      const roomId = socketRoomMap.get(socket.id);
      if (!roomId) {
        socket.emit("error", "Not in a room");
        return;
      }

      let shouldPlayBots = false;

      await withRoomLock(roomId, async () => {
        let state = await getRoom(roomId);
        if (!state) {
          socket.emit("error", "Room not found");
          return;
        }

        const playerIndex = state.players.findIndex(
          (p) => p.socketId === socket.id
        );
        if (playerIndex === -1) {
          socket.emit("error", "Player not found in room");
          return;
        }

        const prevTrumpRevealed = state.trumpRevealed;
        state = playCard(state, playerIndex, cardId);

        if (!prevTrumpRevealed && state.trumpRevealed && state.trumpSuit) {
          io.to(roomId).emit("trump_set", state.trumpSuit, state.players[playerIndex].name);
        }

        if (state.phase === "trick_complete") {
          await broadcastGameState(state);

          io.to(roomId).emit("trick_complete", state.currentTrick, state.currentPlayerIndex);

          await delay(1200);

          state = await getRoom(roomId);
          if (!state) return;
          state = clearTrick(state);
          await broadcastGameState(state);
          shouldPlayBots = true;
          return;
        }

        if (state.phase === "hand_complete" || state.phase === "game_over") {
          await broadcastGameState(state);
          return;
        }

        await broadcastGameState(state);
        shouldPlayBots = true;
      });

      if (shouldPlayBots) playBotTurns(roomId);
    } catch (err) {
      socket.emit("error", errMessage(err, "Failed to play card"));
    }
  });

  socket.on("next_hand", async () => {
    try {
      const roomId = socketRoomMap.get(socket.id);
      if (!roomId) return;

      await withRoomLock(roomId, async () => {
        let state = await getRoom(roomId);
        if (!state || state.phase !== "hand_complete") return;

        state = startHand(state);
        await broadcastGameState(state);
      });

      playBotTurns(roomId);
    } catch (err) {
      socket.emit("error", errMessage(err, "Failed to start next hand"));
    }
  });

  socket.on("new_game", async () => {
    try {
      const roomId = socketRoomMap.get(socket.id);
      if (!roomId) return;

      await withRoomLock(roomId, async () => {
        let state = await getRoom(roomId);
        if (!state) return;

        state = {
          ...state,
          score: [0, 0],
          dealerIndex: 0,
          phase: "waiting",
          handResult: null,
          handWinner: null,
          message: "New game! Waiting to start...",
          trickNumber: 0,
        };

        state = startHand(state);
        await broadcastGameState(state);
      });

      playBotTurns(roomId);
    } catch (err) {
      socket.emit("error", errMessage(err, "Failed to start new game"));
    }
  });

  socket.on("request_lobby", async () => {
    try {
      const rooms = await listRooms();
      socket.emit("lobby_update", rooms);
    } catch (err) {
      socket.emit("error", errMessage(err, "Failed to get lobby"));
    }
  });

  socket.on("disconnect", async () => {
    console.log(`[socket] disconnected: ${socket.id}`);

    const roomId = socketRoomMap.get(socket.id);
    socketRoomMap.delete(socket.id);

    if (!roomId) return;

    const state = await getRoom(roomId);
    if (!state) return;

    const playerIndex = state.players.findIndex(
      (p) => p.socketId === socket.id
    );
    if (playerIndex === -1) return;

    const updatedPlayers = state.players.map((p, i) =>
      i === playerIndex ? { ...p, isConnected: false } : p
    );

    const allDisconnected = updatedPlayers.every(
      (p) => !p.isConnected || p.isBot
    );

    if (allDisconnected) {
      await deleteRoom(roomId);
      return;
    }

    const updatedState: ServerGameState = {
      ...state,
      players: updatedPlayers,
      message: `${state.players[playerIndex].name} disconnected`,
    };

    await broadcastGameState(updatedState);
  });
});

const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";

httpServer.listen(PORT, HOST, () => {
  console.log(
    `[server] Mendicot listening on http://${HOST}:${PORT} (CORS: ${allowedOrigins.join(", ")})`
  );
});
