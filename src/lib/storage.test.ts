/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearMendicotSession,
  loadMendicotSession,
  loadPlayerName,
  saveMendicotSession,
  savePlayerName,
} from "./storage";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("loadPlayerName / savePlayerName", () => {
  it("returns empty string when nothing stored", () => {
    expect(loadPlayerName()).toBe("");
  });

  it("round-trips a trimmed name", () => {
    savePlayerName("  Alice  ");
    expect(loadPlayerName()).toBe("Alice");
  });

  it("migrates legacy localStorage key", () => {
    localStorage.setItem("ethnogames_name", "Legacy");
    expect(loadPlayerName()).toBe("Legacy");
    expect(localStorage.getItem("ethnogames_name:v1")).toBe("Legacy");
    expect(localStorage.getItem("ethnogames_name")).toBeNull();
  });
});

describe("loadMendicotSession / saveMendicotSession / clearMendicotSession", () => {
  it("returns null when no session", () => {
    expect(loadMendicotSession()).toBeNull();
  });

  it("round-trips and normalizes room id", () => {
    saveMendicotSession({ roomId: " abc123 ", playerId: "p1" });
    expect(loadMendicotSession()).toEqual({
      roomId: "ABC123",
      playerId: "p1",
    });
  });

  it("rejects invalid session payload", () => {
    sessionStorage.setItem(
      "ethnogames_mendicot_session:v1",
      JSON.stringify({ roomId: "ABC" })
    );
    expect(loadMendicotSession()).toBeNull();
  });

  it("migrates legacy session key", () => {
    sessionStorage.setItem(
      "ethnogames_mendicot_session",
      JSON.stringify({ roomId: "xyz789", playerId: "p2" })
    );
    const session = loadMendicotSession();
    expect(session).toEqual({ roomId: "XYZ789", playerId: "p2" });
    expect(sessionStorage.getItem("ethnogames_mendicot_session")).toBeNull();
  });

  it("clearMendicotSession removes current and legacy keys", () => {
    saveMendicotSession({ roomId: "ROOM01", playerId: "p1" });
    sessionStorage.setItem("ethnogames_mendicot_session", "{}");
    clearMendicotSession();
    expect(sessionStorage.getItem("ethnogames_mendicot_session:v1")).toBeNull();
    expect(sessionStorage.getItem("ethnogames_mendicot_session")).toBeNull();
  });
});
