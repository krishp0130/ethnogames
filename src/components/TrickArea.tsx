"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TrickCard, ClientPlayer, SUIT_SYMBOLS, Suit } from "@/types/game";
import PlayingCard from "./PlayingCard";

interface TrickAreaProps {
  currentTrick: TrickCard[];
  players: ClientPlayer[];
  myIndex: number;
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  message: string;
}

function getSeatRelativeToMe(seatIndex: number, myIndex: number): number {
  return (seatIndex - myIndex + 4) % 4;
}

const POSITION_STYLES: Record<number, { x: number; y: number }> = {
  0: { x: 0, y: 40 },    // me (bottom)
  1: { x: 50, y: 0 },    // right
  2: { x: 0, y: -40 },   // top (partner)
  3: { x: -50, y: 0 },   // left
};

const ENTRY_FROM: Record<number, { x: number; y: number }> = {
  0: { x: 0, y: 120 },
  1: { x: 120, y: 0 },
  2: { x: 0, y: -120 },
  3: { x: -120, y: 0 },
};

export default function TrickArea({
  currentTrick,
  players,
  myIndex,
  trumpSuit,
  trumpRevealed,
  message,
}: TrickAreaProps) {
  return (
    <div className="relative w-56 h-56 sm:w-64 sm:h-64">
      {/* Trump indicator */}
      <AnimatePresence>
        {trumpRevealed && trumpSuit && (
          <motion.div
            className="absolute -top-10 left-1/2 flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-amber-500/30 z-10"
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span>Trump</span>
            <span className="text-lg leading-none">{SUIT_SYMBOLS[trumpSuit]}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards played to trick */}
      <AnimatePresence mode="popLayout">
        {currentTrick.map((tc) => {
          const relativeSeat = getSeatRelativeToMe(
            players[tc.playerIndex].seatIndex,
            myIndex
          );
          const pos = POSITION_STYLES[relativeSeat];
          const entry = ENTRY_FROM[relativeSeat];

          return (
            <motion.div
              key={tc.card.id}
              className="absolute left-1/2 top-1/2"
              initial={{
                x: entry.x - 20,
                y: entry.y - 28,
                opacity: 0,
                scale: 0.3,
              }}
              animate={{
                x: pos.x - 20,
                y: pos.y - 28,
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                transition: { duration: 0.2 },
              }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
            >
              <PlayingCard card={tc.card} small animate={false} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Center message when no cards */}
      {currentTrick.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/30 text-sm text-center px-6 font-medium">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
