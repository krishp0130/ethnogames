import type { Card, ClientGameState, ClientPlayer, LobbyRoom } from "@/types/game";
import type { GameSocket } from "@/lib/socket";
import { vi } from "vitest";

export function card(
  id: string,
  rank: Card["rank"] = "A",
  suit: Card["suit"] = "hearts"
): Card {
  return { id, rank, suit };
}

export function clientPlayer(
  overrides: Partial<ClientPlayer> & {
    id: string;
    name: string;
    seatIndex: number;
  }
): ClientPlayer {
  return {
    team: (overrides.seatIndex % 2) as 0 | 1,
    cardCount: 13,
    isConnected: true,
    ...overrides,
  };
}

export function clientGameState(
  overrides: Partial<ClientGameState> = {}
): ClientGameState {
  const { players: overridePlayers, ...rest } = overrides;
  const players = overridePlayers ?? [
    clientPlayer({ id: "p0", name: "Alice", seatIndex: 0 }),
    clientPlayer({ id: "p1", name: "Bob", seatIndex: 1 }),
    clientPlayer({ id: "p2", name: "Carol", seatIndex: 2 }),
    clientPlayer({ id: "p3", name: "Dave", seatIndex: 3 }),
  ];

  return {
    roomId: "TEST01",
    players,
    myIndex: 0,
    dealerIndex: 0,
    currentPlayerIndex: 0,
    currentTrick: [],
    leadSuit: null,
    trumpSuit: null,
    trumpRevealed: false,
    teamTricks: [0, 0],
    teamTens: [0, 0],
    score: [0, 0],
    phase: "playing",
    handResult: null,
    handWinner: null,
    message: "Your turn",
    trickNumber: 1,
    ...rest,
  };
}

export function lobbyRoom(overrides: Partial<LobbyRoom> = {}): LobbyRoom {
  return {
    roomId: "ABC123",
    hostName: "Alice",
    playerCount: 1,
    maxPlayers: 4,
    status: "waiting",
    createdAt: Date.now(),
    ...overrides,
  };
}

type Handler = (...args: unknown[]) => void;

export function createMockSocket() {
  const handlers = new Map<string, Set<Handler>>();

  const socket = {
    on: vi.fn((event: string, cb: Handler) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: Handler) => {
      handlers.get(event)?.delete(cb);
    }),
    emit: vi.fn(),
    connected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
    trigger(event: string, ...args: unknown[]) {
      handlers.get(event)?.forEach((cb) => cb(...args));
    },
  };

  return socket as typeof socket & GameSocket;
}
