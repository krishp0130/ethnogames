import { describe, it, expect, beforeEach } from "vitest";
import { createRoom } from "./game/engine";
import {
  saveRoom,
  getRoom,
  deleteRoom,
  listRooms,
  resetRedisStorageForTests,
} from "./redis";

function waitingRoom(roomId: string, hostName = "Host") {
  return createRoom(roomId, {
    id: "host-1",
    socketId: "sock-1",
    name: hostName,
  });
}

describe("saveRoom / getRoom", () => {
  beforeEach(() => {
    resetRedisStorageForTests();
  });

  it("round-trips room state", async () => {
    const state = waitingRoom("ROOM01");
    await saveRoom("ROOM01", state);
    const loaded = await getRoom("ROOM01");
    expect(loaded).toEqual(state);
  });

  it("returns null for missing room", async () => {
    expect(await getRoom("MISSING")).toBeNull();
  });
});

describe("deleteRoom", () => {
  beforeEach(() => {
    resetRedisStorageForTests();
  });

  it("removes stored room", async () => {
    await saveRoom("DEL01", waitingRoom("DEL01"));
    await deleteRoom("DEL01");
    expect(await getRoom("DEL01")).toBeNull();
  });
});

describe("listRooms", () => {
  beforeEach(() => {
    resetRedisStorageForTests();
  });

  it("lists waiting and in-progress rooms", async () => {
    await saveRoom("W1", waitingRoom("W1", "Alice"));
    const playing = {
      ...waitingRoom("P1", "Bob"),
      phase: "playing" as const,
    };
    await saveRoom("P1", playing);

    const rooms = await listRooms();
    expect(rooms).toHaveLength(2);

    const waiting = rooms.find((r) => r.roomId === "W1");
    expect(waiting).toMatchObject({
      hostName: "Alice",
      playerCount: 1,
      maxPlayers: 4,
      status: "waiting",
    });

    const inProgress = rooms.find((r) => r.roomId === "P1");
    expect(inProgress?.status).toBe("in_progress");
  });

  it("returns empty array when no rooms", async () => {
    expect(await listRooms()).toEqual([]);
  });
});
