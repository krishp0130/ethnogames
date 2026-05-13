export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank =
  | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type Team = 0 | 1;

export interface TrickCard {
  card: Card;
  playerIndex: number;
}

export interface Trick {
  cards: TrickCard[];
  leadSuit: Suit;
  winnerIndex: number;
}

export type GamePhase =
  | "waiting"
  | "dealing"
  | "playing"
  | "trick_complete"
  | "hand_complete"
  | "game_over";

export type HandResult = "normal" | "mendikot" | "fifty_two";

/** Sent to each client — hand only contains THEIR cards */
export interface ClientGameState {
  roomId: string;
  players: ClientPlayer[];
  myIndex: number;
  dealerIndex: number;
  currentPlayerIndex: number;
  currentTrick: TrickCard[];
  leadSuit: Suit | null;
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  teamTricks: [number, number];
  teamTens: [number, number];
  score: [number, number];
  phase: GamePhase;
  handResult: HandResult | null;
  handWinner: Team | null;
  message: string;
  trickNumber: number;
}

export interface ClientPlayer {
  id: string;
  name: string;
  team: Team;
  seatIndex: number;
  cardCount: number;
  isConnected: boolean;
}

/** Full server-side state (never sent to client directly) */
export interface ServerGameState {
  roomId: string;
  players: ServerPlayer[];
  dealerIndex: number;
  currentPlayerIndex: number;
  currentTrick: TrickCard[];
  leadSuit: Suit | null;
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  completedTricks: Trick[];
  teamTricks: [number, number];
  teamTens: [number, number];
  score: [number, number];
  phase: GamePhase;
  handResult: HandResult | null;
  handWinner: Team | null;
  message: string;
  winningScore: number;
  trickNumber: number;
}

export interface ServerPlayer {
  id: string;
  socketId: string;
  name: string;
  hand: Card[];
  team: Team;
  seatIndex: number;
  isConnected: boolean;
  isBot: boolean;
}

export interface LobbyRoom {
  roomId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: "waiting" | "in_progress";
  createdAt: number;
}

// Socket.IO event types
export interface ServerToClientEvents {
  game_state: (state: ClientGameState, hand: Card[]) => void;
  lobby_update: (rooms: LobbyRoom[]) => void;
  room_joined: (roomId: string, playerIndex: number) => void;
  error: (message: string) => void;
  trick_complete: (trick: TrickCard[], winnerIndex: number) => void;
  trump_set: (suit: Suit, playerName: string) => void;
}

export interface ClientToServerEvents {
  create_room: (playerName: string) => void;
  join_room: (roomId: string, playerName: string) => void;
  start_game: () => void;
  play_card: (cardId: string) => void;
  request_lobby: () => void;
  add_bot: () => void;
  next_hand: () => void;
  new_game: () => void;
}

export const RANK_ORDER: Rank[] = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A",
];

export const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

export const SUIT_COLORS: Record<Suit, string> = {
  spades: "#1a1a2e",
  hearts: "#dc2626",
  diamonds: "#dc2626",
  clubs: "#1a1a2e",
};
