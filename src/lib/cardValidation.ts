import type { Card, ClientGameState } from "@/types/game";

/**
 * Client-side valid card check (mirrors server logic for instant UI feedback).
 * The server is still authoritative — this just highlights playable cards.
 */
export function isValidCard(
  card: Card,
  state: ClientGameState,
  hand: Card[]
): boolean {
  if (state.currentTrick.length === 0) return true;
  const leadSuit = state.leadSuit;
  if (!leadSuit) return true;
  const hasSuit = hand.some((c) => c.suit === leadSuit);
  if (!hasSuit) return true;
  return card.suit === leadSuit;
}

export function getValidCardIds(
  state: ClientGameState,
  hand: Card[],
  myIndex: number
): Set<string> {
  if (state.phase !== "playing" || state.currentPlayerIndex !== myIndex) {
    return new Set<string>();
  }
  const ids = new Set<string>();
  for (const c of hand) {
    if (isValidCard(c, state, hand)) ids.add(c.id);
  }
  return ids;
}
