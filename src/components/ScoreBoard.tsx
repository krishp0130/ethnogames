"use client";

import { motion } from "framer-motion";
import { ClientGameState, SUIT_SYMBOLS } from "@/types/game";

interface ScoreBoardProps {
  state: ClientGameState;
}

export default function ScoreBoard({ state }: ScoreBoardProps) {
  const team0 = state.players.filter((p) => p.team === 0);
  const team1 = state.players.filter((p) => p.team === 1);

  return (
    <motion.div
      className="bg-white/[0.04] backdrop-blur-md rounded-2xl border border-white/[0.08] p-5 text-white w-72"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-4">
        Scoreboard
      </h3>

      <div className="space-y-4">
        <TeamRow
          label="Team 1"
          names={team0.map((p) => p.name)}
          score={state.score[0]}
          color="emerald"
        />
        <TeamRow
          label="Team 2"
          names={team1.map((p) => p.name)}
          score={state.score[1]}
          color="blue"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Tricks</span>
          <span className="text-white font-mono font-medium">
            {state.teamTricks[0]} – {state.teamTricks[1]}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Tens captured</span>
          <span className="text-white font-mono font-medium">
            {state.teamTens[0]} – {state.teamTens[1]}
          </span>
        </div>
        {state.trumpSuit && state.trumpRevealed && (
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Trump</span>
            <span className="text-amber-400 font-medium">
              {SUIT_SYMBOLS[state.trumpSuit]}{" "}
              {state.trumpSuit.charAt(0).toUpperCase() + state.trumpSuit.slice(1)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Trick #</span>
          <span className="text-white font-mono">{state.trickNumber} / 13</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Dealer</span>
          <span className="text-white">{state.players[state.dealerIndex].name}</span>
        </div>
      </div>
    </motion.div>
  );
}

function TeamRow({
  label,
  names,
  score,
  color,
}: {
  label: string;
  names: string[];
  score: number;
  color: "emerald" | "blue";
}) {
  const colorMap = {
    emerald: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      bar: "bg-emerald-500",
    },
    blue: {
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      bar: "bg-blue-500",
    },
  };
  const c = colorMap[color];

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className={`text-sm font-semibold ${c.text}`}>{label}</span>
          <p className="text-[10px] text-zinc-600">{names.join(" & ")}</p>
        </div>
        <div className={`${c.bg} border ${c.border} rounded-lg px-3 py-1 text-center`}>
          <span className="text-xl font-bold text-white">{score}</span>
          <span className="text-[10px] text-zinc-500 ml-0.5">/ 5</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${c.bar} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${(score / 5) * 100}%` }}
          transition={{ type: "spring", stiffness: 100 }}
        />
      </div>
    </div>
  );
}
