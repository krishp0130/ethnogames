import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  errMessage,
  generateRoomId,
  allocateUnusedRoomId,
  generatePlayerId,
  delay,
  withRoomLock,
  resetRoomLocksForTests,
} from "./socketHelpers";

describe("errMessage", () => {
  it("returns Error message when present", () => {
    expect(errMessage(new Error("bad"), "fallback")).toBe("bad");
  });

  it("returns fallback for non-Error", () => {
    expect(errMessage("x", "fallback")).toBe("fallback");
  });

  it("returns fallback for Error with empty message", () => {
    expect(errMessage(new Error(""), "fallback")).toBe("fallback");
  });
});

describe("generateRoomId", () => {
  it("returns 6-character uppercase string", () => {
    const id = generateRoomId();
    expect(id).toHaveLength(6);
    expect(id).toBe(id.toUpperCase());
  });
});

describe("allocateUnusedRoomId", () => {
  it("returns first unused id", async () => {
    const taken = new Set(["AAAAAA"]);
    const id = await allocateUnusedRoomId(async (roomId) =>
      taken.has(roomId) ? {} : null
    );
    expect(id).not.toBe("AAAAAA");
  });

  it("throws after 16 collisions", async () => {
    await expect(
      allocateUnusedRoomId(async () => ({}))
    ).rejects.toThrow("Could not allocate a room code");
  });
});

describe("generatePlayerId", () => {
  it("includes player prefix and timestamp", () => {
    const id = generatePlayerId();
    expect(id).toMatch(/^player-\d+-[a-z0-9]+$/);
  });
});

describe("delay", () => {
  it("resolves after specified ms", async () => {
    vi.useFakeTimers();
    const p = delay(100);
    vi.advanceTimersByTime(100);
    await expect(p).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

describe("withRoomLock", () => {
  beforeEach(() => {
    resetRoomLocksForTests();
  });

  it("serializes concurrent operations per room", async () => {
    const order: number[] = [];
    const a = withRoomLock("R1", async () => {
      order.push(1);
      await delay(10);
      order.push(2);
    });
    const b = withRoomLock("R1", async () => {
      order.push(3);
    });
    vi.useFakeTimers();
    const all = Promise.all([a, b]);
    await vi.advanceTimersByTimeAsync(10);
    await all;
    vi.useRealTimers();
    expect(order).toEqual([1, 2, 3]);
  });

  it("allows parallel operations for different rooms", async () => {
    const order: string[] = [];
    await Promise.all([
      withRoomLock("A", async () => {
        order.push("A");
      }),
      withRoomLock("B", async () => {
        order.push("B");
      }),
    ]);
    expect(order).toContain("A");
    expect(order).toContain("B");
  });
});
