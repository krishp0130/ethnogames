import { describe, expect, it } from "vitest";
import { meCardHoverWrapClass, overlapForFan } from "./handLayout";

describe("overlapForFan", () => {
  it("returns 0 for a single card", () => {
    expect(overlapForFan(72, 1, 520)).toBe(0);
  });

  it("clamps overlap between 22 and 58 px", () => {
    expect(overlapForFan(72, 13, 200)).toBe(58);
    expect(overlapForFan(72, 13, 2000)).toBe(22);
  });

  it("computes overlap from available width", () => {
    // 4 cards × 56px = 224; available 200 → raw = (224-200)/3 ≈ 8 → clamp to 22
    expect(overlapForFan(56, 4, 200)).toBe(22);
    // 4 cards × 56px = 224; available 120 → raw = (224-120)/3 ≈ 35
    expect(overlapForFan(56, 4, 120)).toBe(35);
  });
});

describe("meCardHoverWrapClass", () => {
  it("returns base class when not interactable", () => {
    expect(meCardHoverWrapClass("bottom", true, false)).toContain("group/card");
    expect(meCardHoverWrapClass("bottom", true, false)).not.toContain("hover:!z-[60]");
  });

  it("adds bottom lift for horizontal bottom seat", () => {
    const cls = meCardHoverWrapClass("bottom", true, true);
    expect(cls).toContain("origin-bottom");
    expect(cls).toContain("hover:-translate-y-4");
  });

  it("adds top lift for horizontal top seat", () => {
    const cls = meCardHoverWrapClass("top", true, true);
    expect(cls).toContain("origin-top");
    expect(cls).toContain("hover:translate-y-4");
  });

  it("adds side lift for vertical left seat", () => {
    const cls = meCardHoverWrapClass("left", false, true);
    expect(cls).toContain("origin-left");
    expect(cls).toContain("hover:-translate-x-3");
  });

  it("adds side lift for vertical right seat", () => {
    const cls = meCardHoverWrapClass("right", false, true);
    expect(cls).toContain("origin-right");
    expect(cls).toContain("hover:translate-x-3");
  });
});
