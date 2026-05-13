"use client";

import { AnimatePresence } from "framer-motion";
import { Card, ClientPlayer } from "@/types/game";
import PlayingCard from "./PlayingCard";

interface PlayerHandProps {
  player: ClientPlayer;
  hand: Card[];
  validCards: string[];
  isCurrentTurn: boolean;
  isMe: boolean;
  onCardClick: (cardId: string) => void;
  position: "bottom" | "left" | "top" | "right";
}

export default function PlayerHand({
  player,
  hand,
  validCards,
  isCurrentTurn,
  isMe,
  onCardClick,
  position,
}: PlayerHandProps) {
  const isHorizontal = position === "top" || position === "bottom";
  const cardCount = isMe ? hand.length : player.cardCount;

  const containerClass: Record<string, string> = {
    bottom: "absolute bottom-2 left-1/2 -translate-x-1/2",
    top: "absolute top-2 left-1/2 -translate-x-1/2",
    left: "absolute left-2 top-1/2 -translate-y-1/2",
    right: "absolute right-2 top-1/2 -translate-y-1/2",
  };

  const namePositionClass: Record<string, string> = {
    bottom: "text-center mb-1",
    top: "text-center mb-1",
    left: "text-center mb-1",
    right: "text-center mb-1",
  };

  return (
    <div className={containerClass[position]}>
      {/* Player name badge */}
      <div className={namePositionClass[position]}>
        <span
          className={`
            inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
            ${isCurrentTurn
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 glow-active"
              : player.isConnected
              ? "bg-white/[0.06] text-zinc-400 border border-white/[0.08]"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
            }
          `}
        >
          {player.name}
          {isCurrentTurn && (
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          )}
          {!player.isConnected && <span className="text-red-400">●</span>}
        </span>
      </div>

      {/* Cards */}
      <div
        className={`flex ${isHorizontal ? "flex-row" : "flex-col"} items-center justify-center`}
      >
        <AnimatePresence mode="popLayout">
          {isMe
            ? hand.map((card) => {
                const isValid = validCards.includes(card.id);
                return (
                  <div
                    key={card.id}
                    className={isHorizontal ? "-ml-5 first:ml-0" : "-mt-10 first:mt-0"}
                  >
                    <PlayingCard
                      card={card}
                      layoutId={`hand-${card.id}`}
                      onClick={isValid ? () => onCardClick(card.id) : undefined}
                      disabled={isCurrentTurn && !isValid}
                      highlighted={isValid && isCurrentTurn}
                    />
                  </div>
                );
              })
            : Array.from({ length: cardCount }).map((_, idx) => (
                <div
                  key={`${player.id}-${idx}`}
                  className={isHorizontal ? "-ml-6 first:ml-0" : "-mt-10 first:mt-0"}
                >
                  <PlayingCard
                    card={{ suit: "spades", rank: "A", id: `back-${idx}` }}
                    faceDown
                    small
                  />
                </div>
              ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
