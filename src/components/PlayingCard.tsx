"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Card, SUIT_SYMBOLS } from "@/types/game";
import type { CardSize } from "@/lib/trickLayout";

export type { CardSize };

type SizeConfig = {
  card: string;
  padding: string;
  rankText: string;
  suitCorner: string;
  suitCenter: string;
  backInner: string;
  /** Bottom inverted corner — omitted on the smallest size to save space */
  showBottomCorner: boolean;
};

const SIZE_CONFIG: Record<CardSize, SizeConfig> = {
  sm: {
    card: "w-11 h-[3.75rem] rounded-md",
    padding: "p-0.5",
    rankText: "text-[9px] leading-none tabular-nums",
    suitCorner: "text-[8px] leading-none",
    suitCenter: "text-sm leading-none",
    backInner: "w-7 h-10",
    showBottomCorner: false,
  },
  md: {
    card: "w-14 h-[4.5rem] rounded-lg",
    padding: "p-1",
    rankText: "text-[10px] leading-none tabular-nums",
    suitCorner: "text-[9px] leading-none",
    suitCenter: "text-lg leading-none",
    backInner: "w-9 h-12",
    showBottomCorner: true,
  },
  lg: {
    card: "w-[4.5rem] h-[6.5rem] rounded-xl",
    padding: "px-2 py-1.5",
    rankText: "text-sm leading-none tabular-nums",
    suitCorner: "text-[11px] leading-none",
    suitCenter: "text-3xl leading-none",
    backInner: "w-12 h-18",
    showBottomCorner: true,
  },
};

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
  faceDown?: boolean;
  size?: CardSize;
  className?: string;
  layoutId?: string;
  animate?: boolean;
  /** Parent handles hover lift in fanned hands — avoids conflicting transforms with Framer */
  suppressWhileHover?: boolean;
}

function CardFace({
  card,
  cfg,
  symbol,
}: {
  card: Card;
  cfg: SizeConfig;
  symbol: string;
}) {
  return (
    <>
      <div className="self-start leading-none font-bold shrink-0">
        <div className={cfg.rankText}>{card.rank}</div>
        <div className={cfg.suitCorner}>{symbol}</div>
      </div>
      <div
        className={`${cfg.suitCenter} flex flex-1 items-center justify-center min-h-0 w-full`}
        aria-hidden="true"
      >
        {symbol}
      </div>
      {cfg.showBottomCorner ? (
        <div className="self-end leading-none font-bold rotate-180 shrink-0">
          <div className={cfg.rankText}>{card.rank}</div>
          <div className={cfg.suitCorner}>{symbol}</div>
        </div>
      ) : null}
    </>
  );
}

export default memo(function PlayingCard({
  card,
  onClick,
  disabled,
  highlighted,
  faceDown,
  size = "lg",
  className = "",
  layoutId,
  animate = true,
  suppressWhileHover = false,
}: PlayingCardProps) {
  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  const symbol = SUIT_SYMBOLS[card.suit];
  const colorClass = isRed ? "text-red-600" : "text-gray-900";
  const cfg = SIZE_CONFIG[size];

  const MotionOrDiv = animate ? motion.div : "div";
  const motionProps = animate
    ? {
        layoutId,
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0 },
        transition: { type: "spring" as const, stiffness: 300, damping: 25 },
      }
    : {};

  if (faceDown) {
    return (
      <MotionOrDiv
        className={`
          ${cfg.card}
          bg-gradient-to-br from-indigo-600 to-indigo-900
          border border-indigo-400/20
          shadow-lg
          flex items-center justify-center
          select-none overflow-hidden
          ${className}
        `}
        {...motionProps}
      >
        <div
          className={`
            ${cfg.backInner}
            rounded-sm border border-indigo-300/10
            bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]
          `}
        />
      </MotionOrDiv>
    );
  }

  const faceUpClassName = `
    ${cfg.card}
    bg-white
    border-2 shadow-lg
    flex flex-col items-stretch justify-between
    ${cfg.padding} select-none overflow-hidden shrink-0
    transition-[border-color,box-shadow,transform] duration-150
    ${colorClass}
    ${highlighted
      ? "border-amber-400 shadow-amber-400/30 shadow-xl ring-2 ring-amber-400/20 -translate-y-2"
      : "border-gray-200"
    }
    ${disabled
      ? "opacity-30 cursor-not-allowed"
      : onClick
      ? "cursor-pointer hover:border-blue-400 hover:shadow-blue-400/20 hover:shadow-xl active:scale-[0.97] interactive-focus"
      : ""
    }
    ${className}
  `;

  if (!animate) {
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled && !onClick}
        aria-label={
          onClick && !disabled
            ? `Play ${card.rank} of ${card.suit}`
            : `${card.rank} of ${card.suit}`
        }
        className={faceUpClassName}
      >
        <CardFace card={card} cfg={cfg} symbol={symbol} />
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      onClick={disabled ? undefined : onClick}
      disabled={disabled && !onClick}
      aria-label={
        onClick && !disabled
          ? `Play ${card.rank} of ${card.suit}`
          : `${card.rank} of ${card.suit}`
      }
      className={`
        ${cfg.card}
        bg-white
        border-2 shadow-lg
        flex flex-col items-stretch justify-between
        ${cfg.padding} select-none overflow-hidden shrink-0
        transition-colors duration-100
        ${colorClass}
        ${highlighted
          ? "border-amber-400 shadow-amber-400/30 shadow-xl ring-2 ring-amber-400/20"
          : "border-gray-200"
        }
        ${disabled
          ? "opacity-30 cursor-not-allowed"
          : onClick
          ? "cursor-pointer hover:border-blue-400 hover:shadow-blue-400/20 hover:shadow-xl active:scale-[0.97] interactive-focus"
          : ""
        }
        ${className}
      `}
      initial={false}
      animate={{
        scale: 1,
        opacity: 1,
        y: highlighted ? -12 : 0,
      }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileHover={
        suppressWhileHover || disabled || !onClick
          ? undefined
          : { y: -8, scale: 1.05, transition: { duration: 0.15 } }
      }
      whileTap={suppressWhileHover || !onClick || disabled ? undefined : { scale: 0.95 }}
    >
      <CardFace card={card} cfg={cfg} symbol={symbol} />
    </motion.button>
  );
});
