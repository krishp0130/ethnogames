"use client";

import { motion } from "framer-motion";
import { Card, SUIT_SYMBOLS } from "@/types/game";

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
  faceDown?: boolean;
  small?: boolean;
  className?: string;
  layoutId?: string;
  animate?: boolean;
}

export default function PlayingCard({
  card,
  onClick,
  disabled,
  highlighted,
  faceDown,
  small,
  className = "",
  layoutId,
  animate = true,
}: PlayingCardProps) {
  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  const symbol = SUIT_SYMBOLS[card.suit];
  const colorClass = isRed ? "text-red-600" : "text-gray-900";

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
          ${small ? "w-10 h-14 rounded-md" : "w-[4.5rem] h-[6.5rem] rounded-xl"}
          bg-gradient-to-br from-indigo-600 to-indigo-900
          border border-indigo-400/20
          shadow-lg
          flex items-center justify-center
          select-none
          ${className}
        `}
        {...motionProps}
      >
        <div
          className={`
            ${small ? "w-6 h-9" : "w-12 h-18"}
            rounded-sm border border-indigo-300/10
            bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]
          `}
        />
      </MotionOrDiv>
    );
  }

  return (
    <motion.button
      layoutId={layoutId}
      onClick={disabled ? undefined : onClick}
      disabled={disabled && !onClick}
      className={`
        ${small ? "w-10 h-14 rounded-md" : "w-[4.5rem] h-[6.5rem] rounded-xl"}
        bg-white
        border-2 shadow-lg
        flex flex-col items-center justify-between
        ${small ? "p-0.5" : "p-1.5"} select-none
        transition-colors duration-100
        ${colorClass}
        ${highlighted
          ? "border-amber-400 shadow-amber-400/30 shadow-xl ring-2 ring-amber-400/20"
          : "border-gray-200"
        }
        ${disabled
          ? "opacity-30 cursor-not-allowed"
          : onClick
          ? "cursor-pointer hover:border-blue-400 hover:shadow-blue-400/20 hover:shadow-xl active:scale-[0.97]"
          : ""
        }
        ${className}
      `}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: highlighted ? -12 : 0,
      }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileHover={
        onClick && !disabled
          ? { y: -8, scale: 1.05, transition: { duration: 0.15 } }
          : {}
      }
      whileTap={onClick && !disabled ? { scale: 0.95 } : {}}
    >
      <div className="self-start leading-none font-bold">
        <div className={small ? "text-[8px]" : "text-xs"}>{card.rank}</div>
        <div className={small ? "text-[8px]" : "text-[10px]"}>{symbol}</div>
      </div>
      <div className={small ? "text-base" : "text-2xl"}>{symbol}</div>
      <div className="self-end leading-none font-bold rotate-180">
        <div className={small ? "text-[8px]" : "text-xs"}>{card.rank}</div>
        <div className={small ? "text-[8px]" : "text-[10px]"}>{symbol}</div>
      </div>
    </motion.button>
  );
}
