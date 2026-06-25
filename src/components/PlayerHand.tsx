"use client";

import { memo } from "react";
import { AnimatePresence } from "framer-motion";
import { Card, ClientPlayer } from "@/types/game";
import { meCardHoverWrapClass, overlapForFan } from "@/lib/handLayout";
import { useViewportWidth } from "@/lib/useMediaQuery";
import type { CardSize } from "@/lib/trickLayout";
import PlayingCard from "./PlayingCard";

interface PlayerHandProps {
  player: ClientPlayer;
  hand: Card[];
  validCards: ReadonlySet<string>;
  isCurrentTurn: boolean;
  isMe: boolean;
  onCardClick: (cardId: string) => void;
  position: "bottom" | "right" | "top" | "left";
  /** Narrow viewport — tighter fan, smaller hand cards */
  compact?: boolean;
  /** Mobile: render below the table instead of overlaying the felt */
  docked?: boolean;
}

function PlayerBadge({
  player,
  isCurrentTurn,
  compact,
}: {
  player: ClientPlayer;
  isCurrentTurn: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium max-w-[min(88vw,10rem)] truncate
        ${compact ? "text-[10px]" : "text-[10px] sm:text-xs px-2 py-1 sm:px-2.5 sm:py-0.5"}
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
        <span
          className={`w-1.5 h-1.5 shrink-0 bg-amber-400 rounded-full ${compact ? "" : "animate-pulse"}`}
        />
      )}
      {!player.isConnected && <span className="text-red-400 shrink-0">●</span>}
    </span>
  );
}

export default memo(function PlayerHand({
  player,
  hand,
  validCards,
  isCurrentTurn,
  isMe,
  onCardClick,
  position,
  compact = false,
  docked = false,
}: PlayerHandProps) {
  const viewportWidth = useViewportWidth();
  const isHorizontal = position === "top" || position === "bottom";
  const cardCount = isMe ? hand.length : player.cardCount;

  const myCardSize: CardSize =
    docked || (compact && viewportWidth > 0 && viewportWidth < 380)
      ? "sm"
      : compact
        ? "md"
        : "lg";
  const myCardWidth = myCardSize === "sm" ? 44 : myCardSize === "md" ? 56 : 72;
  const availableForFan =
    docked && viewportWidth > 0
      ? viewportWidth - 16
      : compact && viewportWidth > 0
        ? Math.min(viewportWidth - 28, 520)
        : compact
          ? 292
          : 520;

  const containerClass: Record<string, string> = {
    bottom: docked
      ? "relative w-full z-20 shrink-0 bg-zinc-950/90 border-t border-white/[0.06] px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] row-start-3"
      : "absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 max-w-[100vw] px-1",
    top: compact
      ? "absolute top-1 left-1/2 -translate-x-1/2 z-[5]"
      : "absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 z-[5] max-w-[100vw] px-1",
    left: compact
      ? "absolute left-1 top-1/2 -translate-y-1/2 z-[5]"
      : "absolute left-0.5 sm:left-2 top-1/2 -translate-y-1/2 z-[5]",
    right: compact
      ? "absolute right-1 top-1/2 -translate-y-1/2 z-[5]"
      : "absolute right-0.5 sm:right-2 top-1/2 -translate-y-1/2 z-[5]",
  };

  const namePositionClass: Record<string, string> = {
    bottom: docked ? "hidden" : "text-center mb-0.5 sm:mb-1",
    top: "text-center mb-0.5",
    left: "text-center mb-0.5",
    right: "text-center mb-0.5",
  };

  const oppHOverlap = compact ? 16 : 28;
  const oppVOverlap = compact ? 24 : 44;

  const handFlexCrossAlign =
    isMe && isHorizontal && !docked
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

  /* Mobile table: show a compact pile + count instead of full opponent fans */
  if (compact && !isMe) {
    return (
      <div className={containerClass[position]}>
        <div className={namePositionClass[position]}>
          <PlayerBadge player={player} isCurrentTurn={isCurrentTurn} compact />
        </div>
        <div className="flex justify-center">
          <div className="relative">
            <PlayingCard
              card={{ suit: "spades", rank: "A", id: "back" }}
              faceDown
              size="sm"
              animate={false}
            />
            {cardCount > 0 ? (
              <span className="absolute -bottom-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-0.5 rounded-full bg-zinc-900/95 border border-white/15 text-[9px] font-bold text-zinc-200 flex items-center justify-center tabular-nums">
                {cardCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const cardList = isMe
    ? hand.map((card, idx) => {
        const isValid = validCards.has(card.id);
        const overlap = overlapForFan(myCardWidth, hand.length, availableForFan);
        const canLift = isCurrentTurn && isValid;
        return (
          <div
            key={card.id}
            className={meCardHoverWrapClass(position, isHorizontal, canLift)}
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
              layoutId={compact ? undefined : `hand-${card.id}`}
              animate={!compact}
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
            animate={!compact}
          />
        </div>
      ));

  const handRow = (
    <div
      className={`hand-scroll flex ${isHorizontal ? "flex-row" : "flex-col"} ${handFlexCrossAlign} ${handFlexInset} justify-center overflow-x-auto overflow-y-visible ${docked ? "w-full max-w-full min-h-[3.75rem]" : "max-w-[100vw] sm:overflow-visible"} [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isMe && !isHorizontal ? "py-4" : ""}`}
      style={
        isMe && isHorizontal && hand.length > 1 && !docked
          ? {
              marginLeft: `${(hand.length - 1) * (compact ? 8 : 16)}px`,
              marginRight: `${(hand.length - 1) * (compact ? 8 : 16)}px`,
            }
          : undefined
      }
    >
      {compact ? cardList : <AnimatePresence mode="popLayout">{cardList}</AnimatePresence>}
    </div>
  );

  return (
    <div
      className={containerClass[position]}
      data-testid={docked ? "player-hand-dock" : undefined}
    >
      {!docked ? (
        <div className={namePositionClass[position]}>
          <PlayerBadge player={player} isCurrentTurn={isCurrentTurn} compact={compact} />
        </div>
      ) : null}
      {handRow}
    </div>
  );
});
