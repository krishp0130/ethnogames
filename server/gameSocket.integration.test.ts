import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServer, type Server as HttpServer } from "http";
import { type AddressInfo } from "net";
import { io as ioClient, type Socket } from "socket.io-client";
import { attachGameSocket } from "./gameSocket";
import { resetRedisStorageForTests } from "./redis";
import { resetRoomLocksForTests } from "./socketHelpers";

function connectClient(port: number): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://127.0.0.1:${port}`, {
      transports: ["websocket"],
      forceNew: true,
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
  });
}

function once<T extends unknown[]>(
  socket: Socket,
  event: string
): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (...args: T) => resolve(args));
  });
}

describe("attachGameSocket", () => {
  let httpServer: HttpServer;
  let port: number;

  beforeEach(async () => {
    resetRedisStorageForTests();
    resetRoomLocksForTests();
    httpServer = createServer();
    attachGameSocket(httpServer);
    await new Promise<void>((resolve) => {
      httpServer.listen(0, "127.0.0.1", () => resolve());
    });
    port = (httpServer.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("create_room emits room_joined and game_state", async () => {
    const socket = await connectClient(port);
    const joined = once<[string, number, string]>(socket, "room_joined");
    const state = once(socket, "game_state");
    socket.emit("create_room", "Alice");

    const [roomId, playerIndex, playerId] = await joined;
    expect(roomId).toHaveLength(6);
    expect(playerIndex).toBe(0);
    expect(playerId).toMatch(/^player-/);

    const [clientState] = await state;
    expect(clientState).toMatchObject({
      roomId,
      phase: "waiting",
      myIndex: 0,
    });

    socket.disconnect();
  });

  it("join_room adds a second player", async () => {
    const host = await connectClient(port);
    const hostJoined = once<[string, number, string]>(host, "room_joined");
    host.emit("create_room", "Host");
    const [roomId] = await hostJoined;

    const guest = await connectClient(port);
    const guestJoined = once<[string, number, string]>(guest, "room_joined");
    guest.emit("join_room", roomId, "Guest");
    const [, guestIndex] = await guestJoined;
    expect(guestIndex).toBe(1);

    host.disconnect();
    guest.disconnect();
  });

  it("rejects invalid play_card when not in room", async () => {
    const socket = await connectClient(port);
    const err = once<[string]>(socket, "error");
    socket.emit("play_card", "A_spades");
    const [message] = await err;
    expect(message).toBe("Not in a room");
    socket.disconnect();
  });

  it("request_lobby returns open rooms", async () => {
    const host = await connectClient(port);
    const hostJoined = once<[string, number, string]>(host, "room_joined");
    host.emit("create_room", "Host");
    const [roomId] = await hostJoined;

    const browser = await connectClient(port);
    const lobby = once<[Array<{ roomId: string; status: string }>]>(
      browser,
      "lobby_update"
    );
    browser.emit("request_lobby");
    const [rooms] = await lobby;
    expect(rooms.some((r) => r.roomId === roomId && r.status === "waiting")).toBe(
      true
    );

    host.disconnect();
    browser.disconnect();
  });
});
