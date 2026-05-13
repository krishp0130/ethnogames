import { describe, it, expect } from "vitest";
import type { Card, ServerGameState, ServerPlayer, Suit, Rank } from "../../src/types/game";
import {
  createRoom,
  addPlayer,
  startHand,
  getValidCards,
  playCard,
  clearTrick,
  toClientState,
} from "./engine";

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit, id: `${rank}_${suit}` };
}

function player(
  i: number,
  hand: Card[],
  overrides: Partial<ServerPlayer> = {}
): ServerPlayer {
  return {
    id: `p${i}`,
    socketId: `sock${i}`,
    name: `Player${i}`,
    hand,
    team: (i % 2) as 0 | 1,
    seatIndex: i,
    isConnected: true,
    isBot: false,
    ...overrides,
  };
}

function playingState(partial: Partial<ServerGameState>): ServerGameState {
  const defaults: ServerGameState = {
    roomId: "TEST",
    players: [
      player(0, [card("A", "hearts"), card("2", "clubs")]),
      player(1, [card("K", "hearts")]),
      player(2, [card("Q", "spades")]),
      player(3, [card("J", "spades")]),
    ],
    dealerIndex: 0,
    currentPlayerIndex: 0,
    currentTrick: [],
    leadSuit: null,
    trumpSuit: null,
    trumpRevealed: false,
    completedTricks: [],
    teamTricks: [0, 0],
    teamTens: [0, 0],
    score: [0, 0],
    phase: "playing",
    handResult: null,
    handWinner: null,
    message: "",
    winningScore: 5,
    trickNumber: 1,
  };
  return { ...defaults, ...partial, players: partial.players ?? defaults.players };
}

describe("createRoom / addPlayer", () => {
  it("createRoom starts in waiting with host", () => {
    const s = createRoom("ABC", {
      id: "h1",
      socketId: "s1",
      name: "Host",
    });
    expect(s.phase).toBe("waiting");
    expect(s.players).toHaveLength(1);
    expect(s.players[0].name).toBe("Host");
  });

  it("addPlayer throws when room is full", () => {
    let s = createRoom("ABC", { id: "p0", socketId: "s0", name: "A" });
    s = addPlayer(s, { id: "p1", socketId: "s1", name: "B" });
    s = addPlayer(s, { id: "p2", socketId: "s2", name: "C" });
    s = addPlayer(s, { id: "p3", socketId: "s3", name: "D" });
    expect(() =>
      addPlayer(s, { id: "p4", socketId: "s4", name: "E" })
    ).toThrow("Room is full");
  });

  it("addPlayer throws when game already started", () => {
    const s: ServerGameState = {
      ...createRoom("ABC", { id: "p0", socketId: "s0", name: "A" }),
      phase: "playing",
    };
    expect(() =>
      addPlayer(s, { id: "p1", socketId: "s1", name: "B" })
    ).toThrow("Game already in progress");
  });
});

describe("startHand", () => {
  it("deals 13 cards each and sets playing phase", () => {
    let s = createRoom("ABC", { id: "p0", socketId: "s0", name: "A" });
    s = addPlayer(s, { id: "p1", socketId: "s1", name: "B" });
    s = addPlayer(s, { id: "p2", socketId: "s2", name: "C" });
    s = addPlayer(s, { id: "p3", socketId: "s3", name: "D" });
    s = startHand(s);
    expect(s.phase).toBe("playing");
    expect(s.players.every((p) => p.hand.length === 13)).toBe(true);
  });

  it("throws without four players", () => {
    const s = createRoom("ABC", { id: "p0", socketId: "s0", name: "A" });
    expect(() => startHand(s)).toThrow("Need exactly 4 players");
  });
});

describe("getValidCards", () => {
  it("allows any card when leading", () => {
    const s = playingState({ currentTrick: [], leadSuit: null });
    const valid = getValidCards(s, 0);
    expect(valid).toHaveLength(2);
  });

  it("requires following lead suit when possible", () => {
    const s = playingState({
      currentPlayerIndex: 1,
      currentTrick: [{ card: card("5", "hearts"), playerIndex: 0 }],
      leadSuit: "hearts",
      players: [
        player(0, []),
        player(1, [card("A", "hearts"), card("2", "diamonds")]),
        player(2, []),
        player(3, []),
      ],
    });
    const valid = getValidCards(s, 1);
    expect(valid.map((c) => c.id)).toEqual(["A_hearts"]);
  });

  it("allows any card when void in lead suit", () => {
    const s = playingState({
      currentPlayerIndex: 1,
      currentTrick: [{ card: card("5", "hearts"), playerIndex: 0 }],
      leadSuit: "hearts",
      players: [
        player(0, []),
        player(1, [card("2", "diamonds"), card("3", "clubs")]),
        player(2, []),
        player(3, []),
      ],
    });
    expect(getValidCards(s, 1)).toHaveLength(2);
  });
});

describe("playCard", () => {
  it("sets lead suit on first card of trick", () => {
    const s = playingState({
      currentPlayerIndex: 0,
      currentTrick: [],
      leadSuit: null,
    });
    const next = playCard(s, 0, "A_hearts");
    expect(next.leadSuit).toBe("hearts");
    expect(next.currentTrick).toHaveLength(1);
    expect(next.players[0].hand.map((c) => c.id)).toEqual(["2_clubs"]);
  });

  it("throws when not players turn", () => {
    const s = playingState({ currentPlayerIndex: 0 });
    expect(() => playCard(s, 1, "K_hearts")).toThrow("Not your turn");
  });

  it("throws when must follow suit", () => {
    const s = playingState({
      currentPlayerIndex: 1,
      currentTrick: [{ card: card("5", "hearts"), playerIndex: 0 }],
      leadSuit: "hearts",
      players: [
        player(0, []),
        player(1, [card("A", "hearts"), card("2", "diamonds")]),
        player(2, []),
        player(3, []),
      ],
    });
    expect(() => playCard(s, 1, "2_diamonds")).toThrow(/follow suit/);
  });

  it("throws when card not in hand", () => {
    const s = playingState({ currentPlayerIndex: 0 });
    expect(() => playCard(s, 0, "K_spades")).toThrow("Card not in hand");
  });
});

describe("clearTrick", () => {
  it("clears trick when phase is trick_complete", () => {
    const s = playingState({
      phase: "trick_complete",
      currentTrick: [{ card: card("A", "hearts"), playerIndex: 0 }],
      currentPlayerIndex: 2,
      trickNumber: 3,
    });
    const next = clearTrick(s);
    expect(next.currentTrick).toHaveLength(0);
    expect(next.phase).toBe("playing");
    expect(next.trickNumber).toBe(4);
  });

  it("no-op when not trick_complete", () => {
    const s = playingState({ phase: "playing" });
    expect(clearTrick(s).phase).toBe("playing");
  });
});

describe("toClientState", () => {
  it("hides trump until revealed", () => {
    const s = playingState({
      trumpSuit: "diamonds",
      trumpRevealed: false,
    });
    const { state } = toClientState(s, 0);
    expect(state.trumpSuit).toBeNull();
  });

  it("exposes trump when revealed", () => {
    const s = playingState({
      trumpSuit: "diamonds",
      trumpRevealed: true,
    });
    const { state } = toClientState(s, 0);
    expect(state.trumpSuit).toBe("diamonds");
  });
});
