import { describe, it, expect } from "vitest";
import type { Card, ServerGameState, ServerPlayer, Suit, Rank } from "../../src/types/game";
import { aiSelectCard } from "./ai";
import { getValidCards } from "./engine";

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
      player(0, [card("A", "hearts"), card("K", "spades")]),
      player(1, [card("2", "hearts")]),
      player(2, [card("Q", "diamonds")]),
      player(3, [card("J", "clubs")]),
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

describe("aiSelectCard", () => {
  it("returns the only valid card", () => {
    const s = playingState({
      currentPlayerIndex: 1,
      currentTrick: [{ card: card("5", "hearts"), playerIndex: 0 }],
      leadSuit: "hearts",
      players: [
        player(0, []),
        player(1, [card("A", "hearts")]),
        player(2, []),
        player(3, []),
      ],
    });
    const picked = aiSelectCard(s, 1);
    expect(picked.id).toBe("A_hearts");
  });

  it("always picks a legal card when leading", () => {
    const s = playingState({
      currentPlayerIndex: 0,
      currentTrick: [],
      leadSuit: null,
    });
    const picked = aiSelectCard(s, 0);
    const valid = getValidCards(s, 0);
    expect(valid.some((c) => c.id === picked.id)).toBe(true);
  });

  it("follows suit when possible", () => {
    const s = playingState({
      currentPlayerIndex: 1,
      currentTrick: [{ card: card("5", "hearts"), playerIndex: 0 }],
      leadSuit: "hearts",
      players: [
        player(0, []),
        player(1, [card("3", "hearts"), card("9", "clubs")]),
        player(2, []),
        player(3, []),
      ],
    });
    const picked = aiSelectCard(s, 1);
    expect(picked.suit).toBe("hearts");
  });

  it("plays off-suit when void (may set trump)", () => {
    const s = playingState({
      currentPlayerIndex: 1,
      currentTrick: [{ card: card("5", "hearts"), playerIndex: 0 }],
      leadSuit: "hearts",
      trumpSuit: null,
      trumpRevealed: false,
      players: [
        player(0, []),
        player(1, [card("9", "clubs"), card("2", "diamonds")]),
        player(2, []),
        player(3, []),
      ],
    });
    const picked = aiSelectCard(s, 1);
    expect(["clubs", "diamonds"]).toContain(picked.suit);
  });

  it("uses trump to capture a ten in the trick", () => {
    const s = playingState({
      currentPlayerIndex: 3,
      currentTrick: [
        { card: card("10", "hearts"), playerIndex: 0 },
        { card: card("3", "hearts"), playerIndex: 1 },
        { card: card("4", "hearts"), playerIndex: 2 },
      ],
      leadSuit: "hearts",
      trumpSuit: "spades",
      trumpRevealed: true,
      players: [
        player(0, []),
        player(1, []),
        player(2, []),
        player(3, [card("2", "spades"), card("5", "clubs")]),
      ],
    });
    const picked = aiSelectCard(s, 3);
    expect(picked.suit).toBe("spades");
  });

  it("ducks low when partner is winning", () => {
    const s = playingState({
      currentPlayerIndex: 3,
      currentTrick: [
        { card: card("5", "hearts"), playerIndex: 0 },
        { card: card("A", "hearts"), playerIndex: 2 },
        { card: card("4", "hearts"), playerIndex: 1 },
      ],
      leadSuit: "hearts",
      trumpSuit: null,
      trumpRevealed: false,
      players: [
        player(0, []),
        player(1, []),
        player(2, []),
        player(3, [card("3", "hearts"), card("K", "diamonds")]),
      ],
    });
    const picked = aiSelectCard(s, 3);
    expect(picked.id).toBe("3_hearts");
  });
});

describe("aiSelectCard leading preference", () => {
  it("leads ace or king when available", () => {
    const s = playingState({
      currentPlayerIndex: 0,
      currentTrick: [],
      players: [
        player(0, [card("A", "clubs"), card("5", "diamonds")]),
        player(1, []),
        player(2, []),
        player(3, []),
      ],
    });
    const picked = aiSelectCard(s, 0);
    expect(["A_clubs"]).toContain(picked.id);
  });
});
