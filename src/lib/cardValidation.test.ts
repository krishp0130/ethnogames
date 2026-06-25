import { describe, expect, it } from "vitest";
import type { Card, ClientGameState } from "@/types/game";
import { getValidCardIds, isValidCard } from "./cardValidation";

function card(id: string, suit: Card["suit"]): Card {
  return { id, suit, rank: "A" };
}

function baseState(overrides: Partial<ClientGameState> = {}): ClientGameState {
  return {
    roomId: "TEST",
    players: [],
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
    message: "",
    trickNumber: 1,
    ...overrides,
  };
}

describe("isValidCard", () => {
  const hand = [card("h1", "hearts"), card("c1", "clubs")];

  it("allows any card on empty trick", () => {
    const state = baseState();
    expect(isValidCard(hand[0], state, hand)).toBe(true);
    expect(isValidCard(hand[1], state, hand)).toBe(true);
  });

  it("requires following lead suit when possible", () => {
    const state = baseState({
      currentTrick: [{ card: card("x", "hearts"), playerIndex: 1 }],
      leadSuit: "hearts",
    });
    expect(isValidCard(hand[0], state, hand)).toBe(true);
    expect(isValidCard(hand[1], state, hand)).toBe(false);
  });

  it("allows any card when void in lead suit", () => {
    const state = baseState({
      currentTrick: [{ card: card("x", "diamonds"), playerIndex: 1 }],
      leadSuit: "diamonds",
     });
    expect(isValidCard(hand[0], state, hand)).toBe(true);
    expect(isValidCard(hand[1], state, hand)).toBe(true);
  });
});

describe("getValidCardIds", () => {
  const hand = [card("h1", "hearts"), card("c1", "clubs")];

  it("returns empty set when not my turn", () => {
    const state = baseState({ currentPlayerIndex: 1 });
    expect(getValidCardIds(state, hand, 0)).toEqual(new Set());
  });

  it("returns empty set outside playing phase", () => {
    const state = baseState({ phase: "waiting" });
    expect(getValidCardIds(state, hand, 0)).toEqual(new Set());
  });

  it("returns playable ids on my turn", () => {
    const state = baseState({
      currentTrick: [{ card: card("x", "hearts"), playerIndex: 1 }],
      leadSuit: "hearts",
    });
    expect(getValidCardIds(state, hand, 0)).toEqual(new Set(["h1"]));
  });
});
