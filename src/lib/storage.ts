/** Versioned browser storage helpers (Vercel: client-localstorage-schema). */

const PLAYER_NAME_KEY = "ethnogames_name:v1";
const MENDICOT_SESSION_KEY = "ethnogames_mendicot_session:v1";

const LEGACY_PLAYER_NAME_KEY = "ethnogames_name";
const LEGACY_MENDICOT_SESSION_KEY = "ethnogames_mendicot_session";

export interface MendicotSession {
  roomId: string;
  playerId: string;
}

export function loadPlayerName(): string {
  try {
    const current = localStorage.getItem(PLAYER_NAME_KEY);
    if (current) return current;

    const legacy = localStorage.getItem(LEGACY_PLAYER_NAME_KEY);
    if (legacy) {
      localStorage.setItem(PLAYER_NAME_KEY, legacy);
      localStorage.removeItem(LEGACY_PLAYER_NAME_KEY);
      return legacy;
    }
  } catch {
    /* private browsing / quota */
  }
  return "";
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name.trim());
  } catch {
    /* ignore */
  }
}

export function loadMendicotSession(): MendicotSession | null {
  try {
    const raw =
      sessionStorage.getItem(MENDICOT_SESSION_KEY) ??
      sessionStorage.getItem(LEGACY_MENDICOT_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { roomId?: string; playerId?: string };
    if (!parsed.roomId || !parsed.playerId) return null;

    const session: MendicotSession = {
      roomId: String(parsed.roomId).trim().toUpperCase(),
      playerId: parsed.playerId,
    };

    sessionStorage.setItem(MENDICOT_SESSION_KEY, JSON.stringify(session));
    sessionStorage.removeItem(LEGACY_MENDICOT_SESSION_KEY);
    return session;
  } catch {
    return null;
  }
}

export function saveMendicotSession(session: MendicotSession): void {
  try {
    sessionStorage.setItem(
      MENDICOT_SESSION_KEY,
      JSON.stringify({
        roomId: session.roomId.trim().toUpperCase(),
        playerId: session.playerId,
      })
    );
  } catch {
    /* ignore */
  }
}

export function clearMendicotSession(): void {
  try {
    sessionStorage.removeItem(MENDICOT_SESSION_KEY);
    sessionStorage.removeItem(LEGACY_MENDICOT_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
