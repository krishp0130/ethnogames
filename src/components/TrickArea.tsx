"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TrickCard, ClientPlayer, SUIT_SYMBOLS, Suit } from "@/types/game";
import { useMediaQuery } from "@/lib/useMediaQuery";
import {
  TRICK_LAYOUTS,
  trickEntryFor,
  trickPositionFor,
  type CardSize,
} from "@/lib/trickLayout";
import { getRelativeSeat } from "@/lib/seats";
import PlayingCard from "./PlayingCard";

interface TrickAreaProps {
  currentTrick: TrickCard[];
  players: ClientPlayer[];
  myIndex: number;
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  message: string;
}

export default function TrickArea({
  currentTrick,
  players,
  myIndex,
  trumpSuit,
  trumpRevealed,
  message,
}: TrickAreaProps) {
  const isCompact = useMediaQuery("(max-width: 639.98px)");
  const isNarrow = useMediaQuery("(max-width: 379.98px)");
  const size: CardSize = isNarrow ? "sm" : isCompact ? "md" : "lg";
  const layout = TRICK_LAYOUTS[size];

  return (
    <div className={`relative ${layout.container}`}>
      {/* Trump indicator (pinned above the trick area) */}
      <AnimatePresence>
        {trumpRevealed && trumpSuit && (
          <motion.div
            className="absolute -top-9 left-1/2 flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-amber-500/30 z-10 whitespace-nowrap"
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span>Trump</span>
            <span className="text-base leading-none">{SUIT_SYMBOLS[trumpSuit]}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards played to trick */}
      <AnimatePresence mode="popLayout">
        {currentTrick.map((tc) => {
          const relativeSeat = getRelativeSeat(
            players[tc.playerIndex].seatIndex,
            myIndex
          );
          const pos = trickPositionFor(layout, relativeSeat);
          const entry = trickEntryFor(relativeSeat);

          return (
            <motion.div
              key={tc.card.id}
              className="absolute left-1/2 top-1/2"
              style={{
                marginLeft: -layout.cardW / 2,
                marginTop: -layout.cardH / 2,
              }}
              initial={
                isCompact
                  ? false
                  : {
                      x: entry.x,
                      y: entry.y,
                      opacity: 0,
                      scale: 0.6,
                    }
              }
              animate={{
                x: pos.x,
                y: pos.y,
                opacity: 1,
                scale: 1,
              }}
              exit={
                isCompact
                  ? { opacity: 0, transition: { duration: 0.12 } }
                  : {
                      opacity: 0,
                      scale: 0.6,
                      transition: { duration: 0.18 },
                    }
              }
              transition={
                isCompact
                  ? { duration: 0.2, ease: "easeOut" }
                  : {
                      type: "spring",
                      stiffness: 260,
                      damping: 26,
                    }
              }
            >
              <PlayingCard card={tc.card} size={size} animate={false} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Center message when no cards have been played yet */}
      {currentTrick.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <p className="text-white/35 text-xs sm:text-sm text-center font-medium leading-snug">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
