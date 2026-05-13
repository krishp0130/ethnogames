import type {
  Card,
  Team,
  TrickCard,
  Trick,
  ServerGameState,
  ServerPlayer,
  ClientGameState,
  ClientPlayer,
  HandResult,
} from "../../src/types/game";
import { createDeck, shuffleDeck, dealCards, getRankValue, sortHand } from "./deck";

/** Counter-clockwise play order: 0 → 3 → 2 → 1 → 0 */
const PLAY_ORDER = [0, 3, 2, 1];

function nextPlayer(currentIndex: number): number {
  const pos = PLAY_ORDER.indexOf(currentIndex);
  return PLAY_ORDER[(pos + 1) % 4];
}

function playerTeam(playerIndex: number): Team {
  return (playerIndex % 2) as Team;
}

export function createRoom(
  roomId: string,
  hostPlayer: { id: string; socketId: string; name: string }
): ServerGameState {
  const player: ServerPlayer = {
    id: hostPlayer.id,
    socketId: hostPlayer.socketId,
    name: hostPlayer.name,
    hand: [],
    team: 0,
    seatIndex: 0,
    isConnected: true,
    isBot: false,
  };

  return {
    roomId,
    players: [player],
    dealerIndex: 0,
    currentPlayerIndex: 0,
    currentTrick: [],
    leadSuit: null,
    trumpSuit: null,
    trumpRevealed: false,
    completedTricks: [],
    teamTricks: [0, 0],
    teamTens: [0, 0],
    score: [0, 0],
    phase: "waiting",
    handResult: null,
    handWinner: null,
    message: `${hostPlayer.name} created the room`,
    winningScore: 5,
    trickNumber: 0,
  };
}

export function addPlayer(
  state: ServerGameState,
  player: { id: string; socketId: string; name: string }
): ServerGameState {
  if (state.players.length >= 4) {
    throw new Error("Room is full");
  }
  if (state.phase !== "waiting") {
    throw new Error("Game already in progress");
  }

  const seatIndex = state.players.length;
  const newPlayer: ServerPlayer = {
    id: player.id,
    socketId: player.socketId,
    name: player.name,
    hand: [],
    team: playerTeam(seatIndex),
    seatIndex,
    isConnected: true,
    isBot: false,
  };

  return {
    ...state,
    players: [...state.players, newPlayer],
    message: `${player.name} joined the room`,
  };
}

export function addBot(state: ServerGameState): ServerGameState {
  if (state.players.length >= 4) {
    throw new Error("Room is full");
  }
  if (state.phase !== "waiting") {
    throw new Error("Game already in progress");
  }

  const seatIndex = state.players.length;
  const botNumber = state.players.filter((p) => p.isBot).length + 1;
  const botPlayer: ServerPlayer = {
    id: `bot-${seatIndex}-${Date.now()}`,
    socketId: "",
    name: `Bot ${botNumber}`,
    hand: [],
    team: playerTeam(seatIndex),
    seatIndex,
    isConnected: true,
    isBot: true,
  };

  return {
    ...state,
    players: [...state.players, botPlayer],
    message: `${botPlayer.name} joined the room`,
  };
}

export function startHand(state: ServerGameState): ServerGameState {
  if (state.players.length !== 4) {
    throw new Error("Need exactly 4 players to start");
  }

  const deck = shuffleDeck(createDeck());
  const hands = dealCards(deck);

  const players = state.players.map((p, i) => ({
    ...p,
    hand: sortHand(hands[i]),
  }));

  // First player is to the dealer's right (counter-clockwise)
  const firstPlayer = nextPlayer(state.dealerIndex);

  return {
    ...state,
    players,
    currentPlayerIndex: firstPlayer,
    currentTrick: [],
    leadSuit: null,
    trumpSuit: null,
    trumpRevealed: false,
    completedTricks: [],
    teamTricks: [0, 0],
    teamTens: [0, 0],
    phase: "playing",
    handResult: null,
    handWinner: null,
    message: `${players[firstPlayer].name}'s turn to lead`,
    trickNumber: 1,
  };
}

export function getValidCards(
  state: ServerGameState,
  playerIndex: number
): Card[] {
  const hand = state.players[playerIndex].hand;
  if (state.currentTrick.length === 0) {
    return hand;
  }

  const leadSuit = state.leadSuit!;
  const suitCards = hand.filter((c) => c.suit === leadSuit);

  if (suitCards.length > 0) {
    return suitCards;
  }

  // Can't follow suit — all cards are valid (and this may set trump)
  return hand;
}

export function playCard(
  state: ServerGameState,
  playerIndex: number,
  cardId: string
): ServerGameState {
  if (state.phase !== "playing") {
    throw new Error("Not in playing phase");
  }
  if (state.currentPlayerIndex !== playerIndex) {
    throw new Error("Not your turn");
  }

  const player = state.players[playerIndex];
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    throw new Error("Card not in hand");
  }

  const card = player.hand[cardIndex];
  const validCards = getValidCards(state, playerIndex);
  if (!validCards.find((c) => c.id === cardId)) {
    throw new Error("Invalid card: must follow suit");
  }

  // Remove card from hand
  const updatedHand = [...player.hand];
  updatedHand.splice(cardIndex, 1);
  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, hand: updatedHand } : p
  );

  const trickCard: TrickCard = { card, playerIndex };
  const updatedTrick = [...state.currentTrick, trickCard];

  let newState: ServerGameState = {
    ...state,
    players: updatedPlayers,
    currentTrick: updatedTrick,
  };

  // Set lead suit on first card of trick
  if (updatedTrick.length === 1) {
    newState.leadSuit = card.suit;
  }

  // Trump detection: first time any player can't follow suit
  if (
    !newState.trumpRevealed &&
    updatedTrick.length > 1 &&
    card.suit !== newState.leadSuit
  ) {
    newState = {
      ...newState,
      trumpSuit: card.suit,
      trumpRevealed: true,
      message: `${player.name} set ${card.suit} as trump (hukum)!`,
    };
  }

  // Trick complete — 4 cards played
  if (updatedTrick.length === 4) {
    return resolveTrick(newState);
  }

  // Advance to next player
  const next = nextPlayer(playerIndex);
  return {
    ...newState,
    currentPlayerIndex: next,
    message: `${updatedPlayers[next].name}'s turn`,
  };
}

function resolveTrick(state: ServerGameState): ServerGameState {
  const trick = state.currentTrick;
  const leadSuit = state.leadSuit!;
  const trumpSuit = state.trumpSuit;

  let winnerIdx = 0;
  let highestValue = -1;
  let winningWithTrump = false;

  for (let i = 0; i < trick.length; i++) {
    const { card } = trick[i];
    const isTrump = trumpSuit !== null && card.suit === trumpSuit;
    const isLeadSuit = card.suit === leadSuit;
    const value = getRankValue(card.rank);

    if (isTrump) {
      if (!winningWithTrump || value > highestValue) {
        winnerIdx = i;
        highestValue = value;
        winningWithTrump = true;
      }
    } else if (isLeadSuit && !winningWithTrump) {
      if (value > highestValue) {
        winnerIdx = i;
        highestValue = value;
      }
    }
  }

  const winnerPlayerIndex = trick[winnerIdx].playerIndex;
  const winnerTeam = playerTeam(winnerPlayerIndex) as 0 | 1;

  const completedTrick: Trick = {
    cards: trick,
    leadSuit,
    winnerIndex: winnerPlayerIndex,
  };

  const teamTricks: [number, number] = [...state.teamTricks];
  teamTricks[winnerTeam]++;

  const teamTens: [number, number] = [...state.teamTens];
  for (const { card } of trick) {
    if (card.rank === "10") {
      teamTens[winnerTeam]++;
    }
  }

  const completedTricks = [...state.completedTricks, completedTrick];
  const trickNumber = state.trickNumber;

  // Check if hand is over (all 13 tricks played)
  if (completedTricks.length === 13) {
    return resolveHand({
      ...state,
      currentTrick: trick,
      completedTricks,
      teamTricks,
      teamTens,
      currentPlayerIndex: winnerPlayerIndex,
      trickNumber,
    });
  }

  return {
    ...state,
    currentTrick: trick,
    completedTricks,
    teamTricks,
    teamTens,
    currentPlayerIndex: winnerPlayerIndex,
    phase: "trick_complete",
    message: `${state.players[winnerPlayerIndex].name} wins trick ${trickNumber}!`,
    trickNumber,
  };
}

function resolveHand(state: ServerGameState): ServerGameState {
  const { teamTricks, teamTens, score, dealerIndex } = state;

  let handResult: HandResult = "normal";
  let handWinner: Team;

  // Check for fifty-two card mendikot (all 13 tricks)
  if (teamTricks[0] === 13) {
    handWinner = 0;
    handResult = "fifty_two";
  } else if (teamTricks[1] === 13) {
    handWinner = 1;
    handResult = "fifty_two";
  }
  // Check for mendikot (all 4 tens)
  else if (teamTens[0] === 4) {
    handWinner = 0;
    handResult = "mendikot";
  } else if (teamTens[1] === 4) {
    handWinner = 1;
    handResult = "mendikot";
  }
  // 3+ tens wins
  else if (teamTens[0] >= 3) {
    handWinner = 0;
  } else if (teamTens[1] >= 3) {
    handWinner = 1;
  }
  // 2 tens each — most tricks wins
  else {
    handWinner = teamTricks[0] > teamTricks[1] ? 0 : 1;
  }

  const newScore: [number, number] = [...score];
  newScore[handWinner] += 1;

  // Determine next dealer
  const dealerTeam = playerTeam(dealerIndex);
  let newDealerIndex: number;

  if (dealerTeam === handWinner) {
    // Dealer's team won — deal passes right (counter-clockwise)
    newDealerIndex = nextPlayer(dealerIndex);
  } else {
    // Dealer's team lost
    if (handResult === "fifty_two") {
      // Opponents won by fifty-two — deal passes right
      newDealerIndex = nextPlayer(dealerIndex);
    } else {
      // Dealer deals again
      newDealerIndex = dealerIndex;
    }
  }

  const resultLabels: Record<HandResult, string> = {
    normal: "",
    mendikot: " by Mendikot!",
    fifty_two: " by Fifty-Two Card Mendikot!",
  };

  const winnerTeamPlayers = state.players
    .filter((_, i) => playerTeam(i) === handWinner)
    .map((p) => p.name)
    .join(" & ");

  const isGameOver = newScore[handWinner] >= state.winningScore;

  return {
    ...state,
    score: newScore,
    dealerIndex: newDealerIndex,
    phase: isGameOver ? "game_over" : "hand_complete",
    handResult,
    handWinner,
    message: isGameOver
      ? `${winnerTeamPlayers} win the game${resultLabels[handResult]}! Final score: ${newScore[0]}-${newScore[1]}`
      : `${winnerTeamPlayers} win the hand${resultLabels[handResult]}! Score: ${newScore[0]}-${newScore[1]}`,
  };
}

/**
 * Clears the current trick display, advancing to next trick.
 * Called after trick_complete animation delay.
 */
export function clearTrick(state: ServerGameState): ServerGameState {
  if (state.phase !== "trick_complete") return state;

  return {
    ...state,
    currentTrick: [],
    leadSuit: null,
    phase: "playing",
    trickNumber: state.trickNumber + 1,
    message: `${state.players[state.currentPlayerIndex].name}'s turn to lead`,
  };
}

export function toClientState(
  state: ServerGameState,
  playerIndex: number
): { state: ClientGameState; hand: Card[] } {
  const clientPlayers: ClientPlayer[] = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    team: p.team,
    seatIndex: p.seatIndex,
    cardCount: p.hand.length,
    isConnected: p.isConnected,
  }));

  const clientState: ClientGameState = {
    roomId: state.roomId,
    players: clientPlayers,
    myIndex: playerIndex,
    dealerIndex: state.dealerIndex,
    currentPlayerIndex: state.currentPlayerIndex,
    currentTrick: state.currentTrick,
    leadSuit: state.leadSuit,
    trumpSuit: state.trumpRevealed ? state.trumpSuit : null,
    trumpRevealed: state.trumpRevealed,
    teamTricks: state.teamTricks,
    teamTens: state.teamTens,
    score: state.score,
    phase: state.phase,
    handResult: state.handResult,
    handWinner: state.handWinner,
    message: state.message,
    trickNumber: state.trickNumber,
  };

  return {
    state: clientState,
    hand: sortHand(state.players[playerIndex]?.hand ?? []),
  };
}
