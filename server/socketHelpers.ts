/** Pure helpers shared by gameSocket (unit-testable). */

export function errMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function allocateUnusedRoomId(
  getRoom: (roomId: string) => Promise<unknown | null>
): Promise<string> {
  for (let attempt = 0; attempt < 16; attempt++) {
    const roomId = generateRoomId();
    const existing = await getRoom(roomId);
    if (!existing) return roomId;
  }
  throw new Error("Could not allocate a room code");
}

export function generatePlayerId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const roomLocks = new Map<string, Promise<void>>();

export async function withRoomLock<T>(
  roomId: string,
  fn: () => Promise<T>
): Promise<T> {
  const prev = roomLocks.get(roomId) ?? Promise.resolve();
  let resolve: () => void;
  const next = new Promise<void>((r) => {
    resolve = r;
  });
  roomLocks.set(roomId, next);
  await prev;
  try {
    return await fn();
  } finally {
    resolve!();
  }
}

/** @internal Clear locks between tests */
export function resetRoomLocksForTests(): void {
  roomLocks.clear();
}
