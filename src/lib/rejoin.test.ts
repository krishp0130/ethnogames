import { describe, expect, it } from "vitest";
import { shouldClearSessionOnRejoinError } from "./rejoin";

describe("shouldClearSessionOnRejoinError", () => {
  it("clears on known stale-session messages", () => {
    expect(shouldClearSessionOnRejoinError("Room not found")).toBe(true);
    expect(shouldClearSessionOnRejoinError("Player not found in room")).toBe(true);
    expect(shouldClearSessionOnRejoinError("Invalid rejoin")).toBe(true);
  });

  it("clears when message contains not found", () => {
    expect(shouldClearSessionOnRejoinError("Seat not found in lobby")).toBe(true);
  });

  it("keeps session on unrelated errors", () => {
    expect(shouldClearSessionOnRejoinError("Not your turn")).toBe(false);
    expect(shouldClearSessionOnRejoinError("Room full")).toBe(false);
  });
});
