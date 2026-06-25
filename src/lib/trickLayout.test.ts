import { describe, expect, it } from "vitest";
import {
  TRICK_LAYOUTS,
  trickEntryFor,
  trickPositionFor,
} from "./trickLayout";

describe("trickPositionFor", () => {
  const layout = TRICK_LAYOUTS.lg;

  it("places bottom seat below center", () => {
    expect(trickPositionFor(layout, 0)).toEqual({ x: 0, y: layout.yOffset });
  });

  it("places right seat to the east", () => {
    expect(trickPositionFor(layout, 1)).toEqual({ x: layout.xOffset, y: 0 });
  });

  it("places top seat above center", () => {
    expect(trickPositionFor(layout, 2)).toEqual({ x: 0, y: -layout.yOffset });
  });

  it("places left seat to the west", () => {
    expect(trickPositionFor(layout, 3)).toEqual({ x: -layout.xOffset, y: 0 });
  });

  it("returns origin for unknown seat", () => {
    expect(trickPositionFor(layout, 99)).toEqual({ x: 0, y: 0 });
  });
});

describe("trickEntryFor", () => {
  it("animates cards in from each seat direction", () => {
    expect(trickEntryFor(0)).toEqual({ x: 0, y: 180 });
    expect(trickEntryFor(1)).toEqual({ x: 180, y: 0 });
    expect(trickEntryFor(2)).toEqual({ x: 0, y: -180 });
    expect(trickEntryFor(3)).toEqual({ x: -180, y: 0 });
  });
});

describe("TRICK_LAYOUTS", () => {
  it("uses card width as minimum horizontal separation", () => {
    for (const size of ["sm", "md", "lg"] as const) {
      const layout = TRICK_LAYOUTS[size];
      expect(layout.xOffset).toBeGreaterThanOrEqual(layout.cardW);
    }
  });
});
