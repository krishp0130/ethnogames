import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types/game";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

export function resolveSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

export function getSocketOptions() {
  return {
    autoConnect: false,
    // Polling first helps on mobile networks and behind some CDNs/proxies.
    transports: ["polling", "websocket"] as ("polling" | "websocket")[],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    timeout: 20_000,
  };
}

export function getSocket(): GameSocket {
  if (!socket) {
    socket = io(resolveSocketUrl(), getSocketOptions());
  }
  return socket;
}

export function connectSocket(): GameSocket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

/** Test-only: reset the socket singleton between Vitest cases. */
export function resetSocketForTests() {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
}
