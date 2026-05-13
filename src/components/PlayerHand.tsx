"use client";

import { AnimatePresence } from "framer-motion";
import { Card, ClientPlayer } from "@/types/game";
import type { CardSize } from "./PlayingCard";
import PlayingCard from "./PlayingCard";

interface PlayerHandProps {
  player: ClientPlayer;
  hand: Card[];
  validCards: string[];
  isCurrentTurn: boolean;
  isMe: boolean;
  onCardClick: (cardId: string) => void;
  position: "bottom" | "right" | "top" | "left";
  /** Narrow viewport — tighter fan, smaller hand cards */
  compact?: boolean;
}

function overlapForFan(
  cardWidth: number,
  count: number,
  availablePx: number
): number {
  if (count <= 1) return 0;
  const raw = (count * cardWidth - availablePx) / (count - 1);
  return Math.min(58, Math.max(22, Math.ceil(raw)));
}

/** Wrapper so hovered card stacks above neighbors and lifts toward the table center */
function meCardHoverWrapClass(
  position: "bottom" | "right" | "top" | "left",
  isHorizontal: boolean
): string {
  const base =
    "group/card relative shrink-0 z-0 transition-[transform,z-index] duration-200 ease-out hover:!z-[60] focus-within:!z-[60]";
  if (isHorizontal) {
    if (position === "bottom") {
      return `${base} origin-bottom hover:scale-110 hover:-translate-y-4 focus-within:scale-110 focus-within:-translate-y-4`;
    }
    return `${base} origin-top hover:scale-110 hover:translate-y-4 focus-within:scale-110 focus-within:translate-y-4`;
  }
  if (position === "left") {
    return `${base} origin-left hover:scale-110 hover:-translate-x-3 focus-within:scale-110 focus-within:-translate-x-3`;
  }
  return `${base} origin-right hover:scale-110 hover:translate-x-3 focus-within:scale-110 focus-within:translate-x-3`;
}

export default function PlayerHand({
  player,
  hand,
  validCards,
  isCurrentTurn,
  isMe,
  onCardClick,
  position,
  compact = false,
}: PlayerHandProps) {
  const isHorizontal = position === "top" || position === "bottom";
  const cardCount = isMe ? hand.length : player.cardCount;

  const myCardSize: CardSize = compact ? "md" : "lg";
  const myCardWidth = compact ? 56 : 72;
  const availableForFan = compact ? 292 : 520;

  const containerClass: Record<string, string> = {
    bottom: "absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 max-w-[100vw] px-1",
    top: "absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 z-[5] max-w-[100vw] px-1",
    left: "absolute left-0.5 sm:left-2 top-1/2 -translate-y-1/2 z-[5]",
    right: "absolute right-0.5 sm:right-2 top-1/2 -translate-y-1/2 z-[5]",
  };

  const namePositionClass: Record<string, string> = {
    bottom: "text-center mb-0.5 sm:mb-1",
    top: "text-center mb-0.5 sm:mb-1",
    left: "text-center mb-0.5 sm:mb-1",
    right: "text-center mb-0.5 sm:mb-1",
  };

  const oppHOverlap = compact ? 20 : 28;
  const oppVOverlap = compact ? 36 : 44;

  const handFlexCrossAlign =
    isMe && isHorizontal
      ? position === "bottom"
        ? "items-end pt-8"
        : position === "top"
          ? "items-start pb-8"
          : "items-center"
      : "items-center";

  const handFlexInset =
    isMe && !isHorizontal
      ? position === "left"
        ? "pl-4"
        : position === "right"
          ? "pr-4"
          : ""
      : "";

  return (
    <div className={containerClass[position]}>
      <div className={namePositionClass[position]}>
        <span
          className={`
            inline-flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-medium max-w-[min(92vw,12rem)] truncate
            ${isCurrentTurn
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 glow-active"
              : player.isConnected
              ? "bg-white/[0.06] text-zinc-400 border border-white/[0.08]"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
            }
          `}
        >
          <span className="truncate">{player.name}</span>
          {isCurrentTurn && (
            <span className="w-1.5 h-1.5 shrink-0 bg-amber-400 rounded-full animate-pulse" />
          )}
          {!player.isConnected && <span className="text-red-400 shrink-0">●</span>}
        </span>
      </div>

      <div
        className={`flex ${isHorizontal ? "flex-row" : "flex-col"} ${handFlexCrossAlign} ${handFlexInset} justify-center overflow-x-auto overflow-y-visible max-w-[100vw] sm:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isMe && !isHorizontal ? "py-4" : ""}`}
        style={
          isMe && isHorizontal && hand.length > 1
            ? {
                marginLeft: `${(hand.length - 1) * (compact ? 8 : 16)}px`,
                marginRight: `${(hand.length - 1) * (compact ? 8 : 16)}px`,
              }
            : undefined
        }
      >
        <AnimatePresence mode="popLayout">
          {isMe
            ? hand.map((card, idx) => {
                const isValid = validCards.includes(card.id);
                const overlap = overlapForFan(
                  myCardWidth,
                  hand.length,
                  availableForFan
                );
                return (
                  <div
                    key={card.id}
                    className={meCardHoverWrapClass(position, isHorizontal)}
                    style={
                      isHorizontal && idx > 0
                        ? { marginLeft: `-${overlap}px` }
                        : !isHorizontal && idx > 0
                        ? { marginTop: compact ? "-36px" : "-40px" }
                        : undefined
                    }
                  >
                    <PlayingCard
                      card={card}
                      size={myCardSize}
                      layoutId={`hand-${card.id}`}
                      onClick={isValid ? () => onCardClick(card.id) : undefined}
                      disabled={isCurrentTurn && !isValid}
                      highlighted={isValid && isCurrentTurn}
                      suppressWhileHover
                    />
                  </div>
                );
              })
            : Array.from({ length: cardCount }).map((_, idx) => (
                <div
                  key={`${player.id}-${idx}`}
                  style={
                    isHorizontal && idx > 0
                      ? { marginLeft: `-${oppHOverlap}px` }
                      : !isHorizontal && idx > 0
                      ? { marginTop: `-${oppVOverlap}px` }
                      : undefined
                  }
                >
                  <PlayingCard
                    card={{ suit: "spades", rank: "A", id: `back-${idx}` }}
                    faceDown
                    size="sm"
                  />
                </div>
              ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
