const REJOIN_CLEAR_MESSAGES = [
  "Room not found",
  "Player not found in room",
  "Invalid rejoin",
] as const;

/** Whether a failed rejoin should drop the stored session (stale room/player). */
export function shouldClearSessionOnRejoinError(message: string): boolean {
  return (
    REJOIN_CLEAR_MESSAGES.includes(
      message as (typeof REJOIN_CLEAR_MESSAGES)[number]
    ) || message.includes("not found")
  );
}
