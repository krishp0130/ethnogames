import { describe, expect, it } from "vitest";
import { getRelativeSeat } from "./seats";

describe("getRelativeSeat", () => {
  it("maps my seat to 0", () => {
    expect(getRelativeSeat(2, 2)).toBe(0);
  });

  it("wraps clockwise around the table", () => {
    expect(getRelativeSeat(3, 2)).toBe(1);
    expect(getRelativeSeat(0, 2)).toBe(2);
    expect(getRelativeSeat(1, 2)).toBe(3);
  });

  it("handles myIndex at seat 0", () => {
    expect(getRelativeSeat(0, 0)).toBe(0);
    expect(getRelativeSeat(1, 0)).toBe(1);
    expect(getRelativeSeat(3, 0)).toBe(3);
  });
});
