import type { Card, ServerGameState, TrickCard } from "../../src/types/game";
import { getRankValue } from "./deck";
import { getValidCards } from "./engine";

/** Counter-clockwise play order: 0 → 3 → 2 → 1 */
function partnerIndex(playerIndex: number): number {
  return (playerIndex + 2) % 4;
}

function isTen(card: Card): boolean {
  return card.rank === "10";
}

function cardStrength(card: Card): number {
  return getRankValue(card.rank);
}

function currentWinner(
  trick: TrickCard[],
  leadSuit: string,
  trumpSuit: string | null
): TrickCard | null {
  if (trick.length === 0) return null;

  let best = trick[0];
  let bestIsTrump = trumpSuit !== null && best.card.suit === trumpSuit;
  let bestValue = cardStrength(best.card);

  for (let i = 1; i < trick.length; i++) {
    const tc = trick[i];
    const isTrump = trumpSuit !== null && tc.card.suit === trumpSuit;
    const value = cardStrength(tc.card);

    if (isTrump && !bestIsTrump) {
      best = tc;
      bestValue = value;
      bestIsTrump = true;
    } else if (isTrump === bestIsTrump) {
      if (isTrump && value > bestValue) {
        best = tc;
        bestValue = value;
      } else if (!isTrump && tc.card.suit === leadSuit && value > bestValue) {
        best = tc;
        bestValue = value;
      }
    }
  }
  return best;
}

function trickHasTen(trick: TrickCard[]): boolean {
  return trick.some((tc) => isTen(tc.card));
}

export function aiSelectCard(
  state: ServerGameState,
  playerIndex: number
): Card {
  const validCards = getValidCards(state, playerIndex);
  if (validCards.length === 1) return validCards[0];

  const partner = partnerIndex(playerIndex);
  const trick = state.currentTrick;
  const leadSuit = state.leadSuit;
  const trumpSuit = state.trumpSuit;

  // Sort by strength for convenience
  const sorted = [...validCards].sort(
    (a, b) => cardStrength(a) - cardStrength(b)
  );
  const sortedDesc = [...sorted].reverse();

  // --- LEADING ---
  if (trick.length === 0) {
    return selectLead(sorted, sortedDesc, trumpSuit);
  }

  // --- FOLLOWING ---
  const winner = currentWinner(trick, leadSuit!, trumpSuit);
  const partnerIsWinning = winner?.playerIndex === partner;
  const hasTenInTrick = trickHasTen(trick);
  const isLastPlayer = trick.length === 3;

  const canFollowSuit = validCards.some((c) => c.suit === leadSuit);

  if (canFollowSuit) {
    return selectFollowSuit(
      sorted,
      sortedDesc,
      partnerIsWinning,
      isLastPlayer,
      hasTenInTrick,
      winner!,
      leadSuit!,
      trumpSuit
    );
  }

  // --- CAN'T FOLLOW SUIT (potential trump) ---
  return selectOffSuit(
    sorted,
    sortedDesc,
    partnerIsWinning,
    isLastPlayer,
    hasTenInTrick,
    trumpSuit
  );
}

function selectLead(
  sorted: Card[],
  sortedDesc: Card[],
  trumpSuit: string | null
): Card {
  const nonTrump = sortedDesc.filter((c) => c.suit !== trumpSuit);

  // Lead with a high non-trump card (try to win tricks, prefer aces/kings)
  const highNonTrump = nonTrump.find(
    (c) => c.rank === "A" || c.rank === "K"
  );
  if (highNonTrump) return highNonTrump;

  // Lead with a ten if we have high backup in the same suit
  for (const card of nonTrump) {
    if (isTen(card)) {
      const sameHigher = nonTrump.filter(
        (c) => c.suit === card.suit && cardStrength(c) > cardStrength(card)
      );
      if (sameHigher.length > 0) return card;
    }
  }

  // Lead with highest non-trump
  if (nonTrump.length > 0) return nonTrump[0];

  // Only trump left — lead lowest
  return sorted[0];
}

function selectFollowSuit(
  sorted: Card[],
  sortedDesc: Card[],
  partnerIsWinning: boolean,
  isLastPlayer: boolean,
  hasTenInTrick: boolean,
  winner: TrickCard,
  leadSuit: string,
  trumpSuit: string | null
): Card {
  const suitCards = sorted.filter((c) => c.suit === leadSuit);
  const suitDesc = [...suitCards].reverse();
  const winnerValue = cardStrength(winner.card);
  const winnerIsTrump = trumpSuit !== null && winner.card.suit === trumpSuit;

  if (partnerIsWinning && isLastPlayer) {
    // Partner is winning and we're last — play low, but dump a ten if safe
    if (hasTenInTrick) return suitCards[0];
    const ten = suitCards.find((c) => isTen(c));
    if (ten) return ten;
    return suitCards[0];
  }

  if (partnerIsWinning) {
    return suitCards[0];
  }

  // Try to win the trick
  if (!winnerIsTrump) {
    const beaters = suitDesc.filter((c) => cardStrength(c) > winnerValue);
    if (beaters.length > 0) {
      // If trick has a ten, play just high enough to win
      if (hasTenInTrick) return beaters[beaters.length - 1];
      return beaters[beaters.length - 1];
    }
  }

  // Can't beat — play lowest
  // But avoid dumping tens if possible
  const nonTens = suitCards.filter((c) => !isTen(c));
  if (nonTens.length > 0) return nonTens[0];
  return suitCards[0];
}

function selectOffSuit(
  sorted: Card[],
  sortedDesc: Card[],
  partnerIsWinning: boolean,
  isLastPlayer: boolean,
  hasTenInTrick: boolean,
  trumpSuit: string | null
): Card {
  const trumpCards = sorted.filter((c) => c.suit === trumpSuit);
  const nonTrump = sorted.filter((c) => c.suit !== trumpSuit);

  if (partnerIsWinning) {
    // Partner winning — don't waste trump; discard low non-trump
    // Try to dump a ten to partner safely if last player
    if (isLastPlayer) {
      const ten = nonTrump.find((c) => isTen(c));
      if (ten) return ten;
    }
    const nonTens = nonTrump.filter((c) => !isTen(c));
    if (nonTens.length > 0) return nonTens[0];
    if (nonTrump.length > 0) return nonTrump[0];
    return sorted[0];
  }

  // Trick has a ten or is valuable — use trump to win
  if (hasTenInTrick && trumpCards.length > 0) {
    return trumpCards[0]; // lowest trump to win
  }

  // Consider trumping in if no trump set yet (we'd be setting it)
  if (trumpSuit === null) {
    // Setting trump — use lowest of the suit with most cards
    const suitCounts = new Map<string, Card[]>();
    for (const c of sorted) {
      const list = suitCounts.get(c.suit) || [];
      list.push(c);
      suitCounts.set(c.suit, list);
    }
    let bestSuit: Card[] = sorted;
    for (const [, cards] of suitCounts) {
      if (cards.length > bestSuit.length) bestSuit = cards;
    }
    return bestSuit[0];
  }

  // Trump to win with low trump
  if (trumpCards.length > 0) {
    return trumpCards[0];
  }

  // No trump — discard lowest non-ten
  const nonTens = nonTrump.filter((c) => !isTen(c));
  if (nonTens.length > 0) return nonTens[0];
  return sorted[0];
}
