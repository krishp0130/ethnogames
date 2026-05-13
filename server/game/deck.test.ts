import { describe, it, expect } from "vitest";
import {
  createDeck,
  shuffleDeck,
  dealCards,
  getRankValue,
  sortHand,
} from "./deck";

describe("createDeck", () => {
  it("creates 52 unique cards", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(52);
  });
});

describe("shuffleDeck", () => {
  it("returns a permutation of the same cards", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled).toHaveLength(52);
    expect([...shuffled].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      [...deck].sort((a, b) => a.id.localeCompare(b.id))
    );
  });
});

describe("dealCards", () => {
  it("deals 13 cards to each of four players from 52-card deck", () => {
    const deck = createDeck();
    const hands = dealCards(deck);
    expect(hands[0]).toHaveLength(13);
    expect(hands[1]).toHaveLength(13);
    expect(hands[2]).toHaveLength(13);
    expect(hands[3]).toHaveLength(13);
    const dealt = [...hands[0], ...hands[1], ...hands[2], ...hands[3]];
    const ids = new Set(dealt.map((c) => c.id));
    expect(ids.size).toBe(52);
  });
});

describe("getRankValue", () => {
  it("orders ranks low to high", () => {
    expect(getRankValue("2")).toBeLessThan(getRankValue("A"));
    expect(getRankValue("10")).toBeLessThan(getRankValue("J"));
  });
});

describe("sortHand", () => {
  it("sorts by suit then rank", () => {
    const hand = [
      { suit: "hearts" as const, rank: "A" as const, id: "A_hearts" },
      { suit: "spades" as const, rank: "2" as const, id: "2_spades" },
      { suit: "spades" as const, rank: "A" as const, id: "A_spades" },
    ];
    const sorted = sortHand(hand);
    expect(sorted.map((c) => c.id)).toEqual(["2_spades", "A_spades", "A_hearts"]);
  });
});
