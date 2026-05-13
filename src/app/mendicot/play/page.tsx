"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Lobby from "@/components/Lobby";
import GameBoard from "@/components/GameBoard";
import { connectSocket, disconnectSocket, type GameSocket } from "@/lib/socket";
import type { ClientGameState, Card } from "@/types/game";

export default function PlayPage() {
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const [inGame, setInGame] = useState(false);
  const socketRef = useRef<GameSocket | null>(null);

  useEffect(() => {
    const s = connectSocket();
    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    s.on("game_state", (state, playerHand) => {
      setGameState(state);
      setHand(playerHand);
      if (state.phase !== "waiting") {
        setInGame(true);
      }
    });

    return () => {
      s.off("connect");
      s.off("disconnect");
      s.off("game_state");
      disconnectSocket();
    };
  }, []);

  const handleGameStart = useCallback(
    (state: ClientGameState, playerHand: Card[]) => {
      setGameState(state);
      setHand(playerHand);
      setInGame(true);
    },
    []
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Connection status */}
      <div className="flex justify-center pt-2">
        <div
          className={`
            inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
            ${connected
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
            }
          `}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400 animate-pulse"}`} />
          {connected ? "Connected" : "Connecting..."}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {!connected && (
            <motion.div
              key="connecting"
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-400">Connecting to game server...</p>
              </div>
            </motion.div>
          )}

          {connected && !inGame && socket && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Lobby socket={socket} onGameStart={handleGameStart} />
            </motion.div>
          )}

          {connected && inGame && socket && gameState && (
            <motion.div
              key="game"
              className="flex-1 py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameBoard socket={socket} state={gameState} hand={hand} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
