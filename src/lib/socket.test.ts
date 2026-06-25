import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

const mockSocket = {
  connected: false,
  connect: mockConnect,
  disconnect: mockDisconnect,
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

describe("resolveSocketUrl", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SERVER_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SERVER_URL;
    } else {
      process.env.NEXT_PUBLIC_SERVER_URL = originalEnv;
    }
  });

  it("prefers NEXT_PUBLIC_SERVER_URL", async () => {
    process.env.NEXT_PUBLIC_SERVER_URL = "https://game.example.com";
    const { resolveSocketUrl } = await import("./socket");
    expect(resolveSocketUrl()).toBe("https://game.example.com");
  });

  it("falls back to localhost in SSR", async () => {
    delete process.env.NEXT_PUBLIC_SERVER_URL;
    const { resolveSocketUrl } = await import("./socket");
    expect(resolveSocketUrl()).toBe("http://localhost:3000");
  });
});

describe("getSocket / connectSocket / disconnectSocket", () => {
  beforeEach(async () => {
    vi.resetModules();
    mockConnect.mockClear();
    mockDisconnect.mockClear();
    mockSocket.connected = false;
    const { resetSocketForTests } = await import("./socket");
    resetSocketForTests();
  });

  it("creates a singleton socket with autoConnect false", async () => {
    const { io } = await import("socket.io-client");
    const { getSocket } = await import("./socket");

    const a = getSocket();
    const b = getSocket();

    expect(a).toBe(b);
    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith(
      "http://localhost:3000",
      expect.objectContaining({ autoConnect: false })
    );
  });

  it("connectSocket connects when disconnected", async () => {
    const { connectSocket } = await import("./socket");
    connectSocket();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("connectSocket skips connect when already connected", async () => {
    mockSocket.connected = true;
    const { connectSocket } = await import("./socket");
    connectSocket();
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("disconnectSocket disconnects when connected", async () => {
    mockSocket.connected = true;
    const { getSocket, disconnectSocket } = await import("./socket");
    getSocket();
    disconnectSocket();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it("disconnectSocket is a no-op when not connected", async () => {
    const { getSocket, disconnectSocket } = await import("./socket");
    getSocket();
    disconnectSocket();
    expect(mockDisconnect).not.toHaveBeenCalled();
  });
});
