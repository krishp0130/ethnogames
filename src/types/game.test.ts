import { describe, expect, it } from "vitest";
import {
  RANK_ORDER,
  SUITS,
  SUIT_COLORS,
  SUIT_SYMBOLS,
} from "@/types/game";

describe("game constants", () => {
  it("RANK_ORDER has 13 ranks from 2 through A", () => {
    expect(RANK_ORDER).toHaveLength(13);
    expect(RANK_ORDER[0]).toBe("2");
    expect(RANK_ORDER.at(-1)).toBe("A");
  });

  it("SUITS lists all four suits", () => {
    expect(SUITS).toEqual(["spades", "hearts", "diamonds", "clubs"]);
  });

  it("SUIT_SYMBOLS maps every suit to a symbol", () => {
    for (const suit of SUITS) {
      expect(SUIT_SYMBOLS[suit].length).toBeGreaterThan(0);
    }
  });

  it("SUIT_COLORS marks red suits", () => {
    expect(SUIT_COLORS.hearts).toBe("#dc2626");
    expect(SUIT_COLORS.diamonds).toBe("#dc2626");
    expect(SUIT_COLORS.spades).toBe("#1a1a2e");
    expect(SUIT_COLORS.clubs).toBe("#1a1a2e");
  });
});
