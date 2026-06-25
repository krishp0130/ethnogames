"use client";

import { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, ClientGameState, SUIT_SYMBOLS } from "@/types/game";
import { getValidCardIds } from "@/lib/cardValidation";
import type { GameSocket } from "@/lib/socket";
import { getRelativeSeat } from "@/lib/seats";
import { useMediaQuery } from "@/lib/useMediaQuery";
import PlayerHand from "./PlayerHand";
import TrickArea from "./TrickArea";
import ScoreBoard from "./ScoreBoard";

const POSITIONS = ["bottom", "right", "top", "left"] as const;

interface GameBoardProps {
  socket: GameSocket;
  state: ClientGameState;
  hand: Card[];
}

const EMPTY_VALID_CARDS = new Set<string>();

export default function GameBoard({ socket, state, hand }: GameBoardProps) {
  const myIndex = state.myIndex;
  const compactLayout = useMediaQuery("(max-width: 639.98px)");

  const handlePlayCard = useCallback(
    (cardId: string) => {
      if (state.currentPlayerIndex !== myIndex || state.phase !== "playing")
        return;
      socket.emit("play_card", cardId);
    },
    [socket, state.currentPlayerIndex, state.phase, myIndex]
  );

  const handleNextHand = () => socket.emit("next_hand");
  const handleNewGame = () => socket.emit("new_game");

  const validCardIds = useMemo(
    () => getValidCardIds(state, hand, myIndex),
    [state, myIndex, hand]
  );

  const orderedPlayers = useMemo(
    () =>
      state.players
        .map((p) => ({
          ...p,
          relativePos: getRelativeSeat(p.seatIndex, myIndex),
        }))
        .sort((a, b) => a.relativePos - b.relativePos),
    [state.players, myIndex]
  );

  return (
    <div className="flex gap-2 sm:gap-4 lg:gap-6 items-start justify-center w-full max-w-7xl mx-auto px-1.5 sm:px-2 py-1 sm:py-2 sm:p-4">
      {/* Scoreboard (desktop) */}
      <div className="hidden lg:block flex-shrink-0 sticky top-20">
        <ScoreBoard state={state} />
      </div>

      <div className="flex-1 flex flex-col items-center gap-4">
        {/* Mobile score strip */}
        <div className="lg:hidden w-full flex flex-col gap-1 bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.08] px-2.5 py-2 text-sm">
          <div className="flex items-center justify-between gap-1.5">
            <div className="shrink-0">
              <span className="text-emerald-400 font-semibold">T1</span>{" "}
              <span className="font-bold tabular-nums">{state.score[0]}</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-500 text-center leading-snug min-w-0 flex-1">
              Tricks {state.teamTricks[0]}–{state.teamTricks[1]} · Tens{" "}
              {state.teamTens[0]}–{state.teamTens[1]}
              {state.trumpSuit && state.trumpRevealed && (
                <span className="text-amber-400">
                  {" "}
                  · Trump {SUIT_SYMBOLS[state.trumpSuit]}
                </span>
              )}
            </div>
            <div className="shrink-0">
              <span className="text-blue-400 font-semibold">T2</span>{" "}
              <span className="font-bold tabular-nums">{state.score[1]}</span>
            </div>
          </div>
          <div className="text-center text-[11px] text-zinc-600">
            Trick {state.trickNumber} / 13
          </div>
        </div>

        {/* Game table — sized to fit mobile browser chrome (nav + score + status) */}
        <div className="relative w-full max-w-2xl mx-auto aspect-[10/11] sm:aspect-square max-sm:max-h-[min(90vw,calc(100dvh-13.5rem))] max-sm:min-h-[17.5rem] felt-bg rounded-2xl sm:rounded-3xl border border-emerald-700/20 shadow-2xl shadow-black/50">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.06),transparent_70%)]" />
          <div className="absolute inset-3 sm:inset-5 rounded-xl sm:rounded-2xl border border-emerald-600/10" />

          {/* Trick area (center) */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <TrickArea
              currentTrick={state.currentTrick}
              players={state.players}
              myIndex={myIndex}
              trumpSuit={state.trumpSuit}
              trumpRevealed={state.trumpRevealed}
              message={state.message}
            />
          </div>

          {/* Player hands */}
          {orderedPlayers.map((player) => {
            const pos = POSITIONS[player.relativePos];
            const isMe = player.seatIndex === myIndex;
            return (
              <PlayerHand
                key={player.id}
                player={player}
                hand={isMe ? hand : []}
                position={pos}
                validCards={isMe ? validCardIds : EMPTY_VALID_CARDS}
                isCurrentTurn={state.currentPlayerIndex === player.seatIndex && state.phase === "playing"}
                isMe={isMe}
                onCardClick={handlePlayCard}
                compact={compactLayout}
              />
            );
          })}

          {/* Hand complete / game over overlay */}
          <AnimatePresence>
            {(state.phase === "hand_complete" || state.phase === "game_over") && (
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30 overscroll-contain"
                role="presentation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="hand-result-title"
                  className="bg-zinc-900/95 border border-white/[0.1] rounded-2xl p-5 sm:p-8 text-center w-[min(calc(100vw-1.5rem),24rem)] max-h-[85dvh] overflow-y-auto overscroll-contain shadow-2xl"
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  {state.phase === "hand_complete" && (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="text-4xl mb-3"
                      >
                        {state.handResult === "fifty_two"
                          ? "👑"
                          : state.handResult === "mendikot"
                          ? "🏆"
                          : "🃏"}
                      </motion.div>
                      <h2 id="hand-result-title" className="text-xl font-bold mb-1 text-balance">
                        {state.handResult === "fifty_two"
                          ? "52-Card Mendikot!"
                          : state.handResult === "mendikot"
                          ? "Mendikot!"
                          : "Hand Complete"}
                      </h2>
                      <p className="text-zinc-300 text-sm mb-1">
                        Team {(state.handWinner ?? 0) + 1} wins the hand!
                      </p>
                      <p className="text-zinc-500 text-xs mb-5">
                        Tens: {state.teamTens[0]}–{state.teamTens[1]} | Tricks:{" "}
                        {state.teamTricks[0]}–{state.teamTricks[1]}
                      </p>

                      <div className="flex gap-3 justify-center mb-5">
                        <ScorePill label="Team 1" score={state.score[0]} color="emerald" />
                        <ScorePill label="Team 2" score={state.score[1]} color="blue" />
                      </div>

                      <button
                        type="button"
                        onClick={handleNextHand}
                        className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Next Hand
                      </button>
                    </>
                  )}

                  {state.phase === "game_over" && (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl mb-3"
                      >
                        🎉
                      </motion.div>
                      <h2 id="hand-result-title" className="text-2xl font-bold mb-2 text-balance">
                        Game Over!
                      </h2>
                      <p className="text-amber-400 text-xl font-bold mb-4">
                        Team {(state.handWinner ?? 0) + 1} wins!
                      </p>
                      <p className="text-zinc-400 text-sm mb-6">
                        Final: {state.score[0]} – {state.score[1]}
                      </p>
                      <button
                        type="button"
                        onClick={handleNewGame}
                        className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                      >
                        Play Again
                      </button>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status bar */}
        <motion.div
          className="text-center text-zinc-300 text-xs sm:text-sm bg-white/[0.04] px-3 sm:px-5 py-2.5 rounded-xl border border-white/[0.06] max-w-full mx-1"
          key={state.message}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {state.message}
        </motion.div>
      </div>
    </div>
  );
}

function ScorePill({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: "emerald" | "blue";
}) {
  const bg = color === "emerald" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-blue-500/10 border-blue-500/20";
  const text = color === "emerald" ? "text-emerald-400" : "text-blue-400";
  return (
    <div className={`${bg} border rounded-lg px-4 py-2`}>
      <span className={`${text} text-xs`}>{label}</span>
      <span className="text-white font-bold text-lg ml-1.5">{score}</span>
    </div>
  );
}

