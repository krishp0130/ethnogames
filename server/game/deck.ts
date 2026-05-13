import { Card, Rank, Suit, SUITS, RANK_ORDER } from "../../src/types/game";

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANK_ORDER) {
      deck.push({ suit, rank, id: `${rank}_${suit}` });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deals 13 cards to each of 4 players in batches of 5-4-4,
 * dealing counter-clockwise starting from the player to the dealer's right.
 */
export function dealCards(deck: Card[]): [Card[], Card[], Card[], Card[]] {
  const hands: [Card[], Card[], Card[], Card[]] = [[], [], [], []];
  let cardIndex = 0;
  const batchSizes = [5, 4, 4];

  for (const batchSize of batchSizes) {
    for (let player = 0; player < 4; player++) {
      for (let c = 0; c < batchSize; c++) {
        hands[player].push(deck[cardIndex++]);
      }
    }
  }

  return hands;
}

export function getRankValue(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

const SUIT_ORDER: Record<Suit, number> = {
  spades: 0,
  hearts: 1,
  diamonds: 2,
  clubs: 3,
};

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    if (suitDiff !== 0) return suitDiff;
    return getRankValue(a.rank) - getRankValue(b.rank);
  });
}
