import { describe, it, expect } from "vitest";
import type { Card, ServerGameState, ServerPlayer, Suit, Rank } from "../../src/types/game";
import {
  createRoom,
  addPlayer,
  addBot,
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

  it("addPlayer assigns alternating teams", () => {
    let s = createRoom("ABC", { id: "p0", socketId: "s0", name: "A" });
    s = addPlayer(s, { id: "p1", socketId: "s1", name: "B" });
    expect(s.players[0].team).toBe(0);
    expect(s.players[1].team).toBe(1);
    expect(s.players[1].seatIndex).toBe(1);
  });
});

describe("addBot", () => {
  it("adds a bot player in waiting room", () => {
    const s = addBot(createRoom("ABC", { id: "p0", socketId: "s0", name: "A" }));
    expect(s.players).toHaveLength(2);
    expect(s.players[1].isBot).toBe(true);
    expect(s.players[1].name).toBe("Bot 1");
  });

  it("throws when room is full", () => {
    let s = createRoom("ABC", { id: "p0", socketId: "s0", name: "A" });
    s = addPlayer(s, { id: "p1", socketId: "s1", name: "B" });
    s = addPlayer(s, { id: "p2", socketId: "s2", name: "C" });
    s = addPlayer(s, { id: "p3", socketId: "s3", name: "D" });
    expect(() => addBot(s)).toThrow("Room is full");
  });

  it("throws when game already started", () => {
    const s: ServerGameState = {
      ...createRoom("ABC", { id: "p0", socketId: "s0", name: "A" }),
      phase: "playing",
    };
    expect(() => addBot(s)).toThrow("Game already in progress");
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

  it("first player is to the dealer's right (counter-clockwise)", () => {
    let s = createRoom("ABC", { id: "p0", socketId: "s0", name: "A" });
    s = addPlayer(s, { id: "p1", socketId: "s1", name: "B" });
    s = addPlayer(s, { id: "p2", socketId: "s2", name: "C" });
    s = addPlayer(s, { id: "p3", socketId: "s3", name: "D" });
    s = { ...s, dealerIndex: 0 };
    s = startHand(s);
    expect(s.currentPlayerIndex).toBe(3);
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

  it("throws when not in playing phase", () => {
    const s = playingState({ phase: "waiting" });
    expect(() => playCard(s, 0, "A_hearts")).toThrow("Not in playing phase");
  });

  it("advances counter-clockwise (0 to 3)", () => {
    const s = playingState({
      currentPlayerIndex: 0,
      currentTrick: [],
      leadSuit: null,
    });
    const next = playCard(s, 0, "A_hearts");
    expect(next.currentPlayerIndex).toBe(3);
  });

  it("sets trump on first off-suit play", () => {
    let s = playingState({
      currentPlayerIndex: 1,
      currentTrick: [{ card: card("5", "hearts"), playerIndex: 0 }],
      leadSuit: "hearts",
      trumpSuit: null,
      trumpRevealed: false,
      players: [
        player(0, []),
        player(1, [card("2", "clubs")]),
        player(2, []),
        player(3, []),
      ],
    });
    s = playCard(s, 1, "2_clubs");
    expect(s.trumpSuit).toBe("clubs");
    expect(s.trumpRevealed).toBe(true);
  });

  it("completes trick and highest trump wins", () => {
    let s = playingState({
      currentPlayerIndex: 3,
      currentTrick: [
        { card: card("5", "hearts"), playerIndex: 0 },
        { card: card("7", "hearts"), playerIndex: 1 },
        { card: card("K", "spades"), playerIndex: 2 },
      ],
      leadSuit: "hearts",
      trumpSuit: "spades",
      trumpRevealed: true,
      players: [
        player(0, []),
        player(1, []),
        player(2, []),
        player(3, [card("A", "spades")]),
      ],
    });
    s = playCard(s, 3, "A_spades");
    expect(s.phase).toBe("trick_complete");
    expect(s.currentPlayerIndex).toBe(3);
    expect(s.teamTricks[1]).toBe(1);
  });

  it("scores mendikot when team captures all tens", () => {
    const completed = Array.from({ length: 12 }, () => ({
      cards: [{ card: card("2", "clubs"), playerIndex: 0 }],
      leadSuit: "clubs" as Suit,
      winnerIndex: 0,
    }));
    let s = playingState({
      completedTricks: completed,
      currentTrick: [
        { card: card("5", "hearts"), playerIndex: 0 },
        { card: card("6", "hearts"), playerIndex: 1 },
        { card: card("7", "hearts"), playerIndex: 2 },
      ],
      leadSuit: "hearts",
      currentPlayerIndex: 3,
      teamTricks: [9, 3],
      teamTens: [4, 0],
      players: [
        player(0, []),
        player(1, []),
        player(2, []),
        player(3, [card("A", "hearts")]),
      ],
    });
    s = playCard(s, 3, "A_hearts");
    expect(s.phase).toBe("hand_complete");
    expect(s.handResult).toBe("mendikot");
    expect(s.handWinner).toBe(0);
    expect(s.score[0]).toBe(1);
  });

  it("ends game when winning score reached", () => {
    const completed = Array.from({ length: 12 }, () => ({
      cards: [{ card: card("2", "clubs"), playerIndex: 0 }],
      leadSuit: "clubs" as Suit,
      winnerIndex: 0,
    }));
    let s = playingState({
      completedTricks: completed,
      currentTrick: [
        { card: card("5", "hearts"), playerIndex: 0 },
        { card: card("6", "hearts"), playerIndex: 1 },
        { card: card("7", "hearts"), playerIndex: 2 },
      ],
      leadSuit: "hearts",
      currentPlayerIndex: 3,
      teamTricks: [13, 0],
      teamTens: [4, 0],
      score: [4, 2],
      players: [
        player(0, []),
        player(1, []),
        player(2, []),
        player(3, [card("A", "hearts")]),
      ],
    });
    s = playCard(s, 3, "A_hearts");
    expect(s.phase).toBe("game_over");
    expect(s.handResult).toBe("fifty_two");
    expect(s.score[0]).toBe(5);
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

  it("hides opponent hands and returns sorted own hand", () => {
    const s = playingState({
      players: [
        player(0, [card("K", "hearts"), card("2", "spades")]),
        player(1, [card("A", "clubs")]),
        player(2, []),
        player(3, []),
      ],
    });
    const { state, hand } = toClientState(s, 0);
    expect(state.players[1].cardCount).toBe(1);
    expect(state.players[1]).not.toHaveProperty("hand");
    expect(hand.map((c) => c.id)).toEqual(["2_spades", "K_hearts"]);
    expect(state.myIndex).toBe(0);
  });
});
