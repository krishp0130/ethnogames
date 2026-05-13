"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TrickCard, ClientPlayer, SUIT_SYMBOLS, Suit } from "@/types/game";
import { useMediaQuery } from "@/lib/useMediaQuery";
import type { CardSize } from "./PlayingCard";
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

// Per-card-size layout. Offsets are chosen so each card is fully visible (no
// overlap with its neighbors) and the four positions form a clean cross.
// Card dims used: md = 56x80, lg = 72x104.
// Layouts are chosen so that adjacent cards in the cross never overlap each
// other visually. Specifically xOffset >= cardW so the top/bottom card and
// the side card don't intersect horizontally even when their y-ranges overlap.
const LAYOUTS: Record<
  CardSize,
  {
    cardW: number;
    cardH: number;
    /** Tailwind size for the trick area square container */
    container: string;
    /** Horizontal offset for left/right seats */
    xOffset: number;
    /** Vertical offset for top/bottom seats */
    yOffset: number;
  }
> = {
  sm: { cardW: 40, cardH: 56, container: "w-44 h-48", xOffset: 44, yOffset: 50 },
  md: { cardW: 56, cardH: 80, container: "w-64 h-72", xOffset: 62, yOffset: 70 },
  lg: { cardW: 72, cardH: 104, container: "w-[22rem] h-[22rem]", xOffset: 80, yOffset: 90 },
};

function positionFor(layout: (typeof LAYOUTS)[CardSize], relativeSeat: number) {
  switch (relativeSeat) {
    case 0:
      return { x: 0, y: layout.yOffset }; // me (bottom)
    case 1:
      return { x: layout.xOffset, y: 0 }; // right
    case 2:
      return { x: 0, y: -layout.yOffset }; // top (partner)
    case 3:
      return { x: -layout.xOffset, y: 0 }; // left
    default:
      return { x: 0, y: 0 };
  }
}

function entryFor(relativeSeat: number) {
  switch (relativeSeat) {
    case 0:
      return { x: 0, y: 180 };
    case 1:
      return { x: 180, y: 0 };
    case 2:
      return { x: 0, y: -180 };
    case 3:
      return { x: -180, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
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
  const size: CardSize = isCompact ? "md" : "lg";
  const layout = LAYOUTS[size];

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
          const relativeSeat = getSeatRelativeToMe(
            players[tc.playerIndex].seatIndex,
            myIndex
          );
          const pos = positionFor(layout, relativeSeat);
          const entry = entryFor(relativeSeat);

          return (
            <motion.div
              key={tc.card.id}
              className="absolute left-1/2 top-1/2"
              style={{
                marginLeft: -layout.cardW / 2,
                marginTop: -layout.cardH / 2,
              }}
              initial={{
                x: entry.x,
                y: entry.y,
                opacity: 0,
                scale: 0.3,
              }}
              animate={{
                x: pos.x,
                y: pos.y,
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
