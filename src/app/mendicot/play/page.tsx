"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Lobby from "@/components/Lobby";
import GameBoard from "@/components/GameBoard";
import { connectSocket, disconnectSocket, type GameSocket } from "@/lib/socket";
import type { ClientGameState, Card } from "@/types/game";

const MENDICOT_SESSION_KEY = "ethnogames_mendicot_session";

export default function PlayPage() {
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const [inGame, setInGame] = useState(false);
  const pendingRejoin = useRef(false);

  useEffect(() => {
    const s = connectSocket();

    const tryRejoin = () => {
      try {
        const raw = window.sessionStorage.getItem(MENDICOT_SESSION_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { roomId?: string; playerId?: string };
        if (parsed.roomId && parsed.playerId) {
          pendingRejoin.current = true;
          s.emit(
            "rejoin_room",
            String(parsed.roomId).trim().toUpperCase(),
            parsed.playerId
          );
        }
      } catch {
        /* ignore corrupt session */
      }
    };

    const onConnect = () => {
      setConnected(true);
      tryRejoin();
    };
    const onDisconnect = () => setConnected(false);

    const onGameState = (state: ClientGameState, playerHand: Card[]) => {
      pendingRejoin.current = false;
      setGameState(state);
      setHand(playerHand);
      try {
        const id = state.players[state.myIndex]?.id;
        if (id && state.roomId) {
          window.sessionStorage.setItem(
            MENDICOT_SESSION_KEY,
            JSON.stringify({ roomId: state.roomId, playerId: id })
          );
        }
      } catch {
        /* ignore */
      }
      if (state.phase !== "waiting") {
        setInGame(true);
      }
    };

    const onRoomJoined = (roomId: string, _playerIndex: number, playerId: string) => {
      pendingRejoin.current = false;
      try {
        window.sessionStorage.setItem(
          MENDICOT_SESSION_KEY,
          JSON.stringify({ roomId, playerId })
        );
      } catch {
        /* ignore */
      }
    };

    const onError = (msg: string) => {
      if (
        pendingRejoin.current &&
        (msg === "Room not found" ||
          msg === "Player not found in room" ||
          msg === "Invalid rejoin" ||
          msg.includes("not found"))
      ) {
        try {
          window.sessionStorage.removeItem(MENDICOT_SESSION_KEY);
        } catch {
          /* ignore */
        }
        pendingRejoin.current = false;
      }
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("game_state", onGameState);
    s.on("room_joined", onRoomJoined);
    s.on("error", onError);

    queueMicrotask(() => {
      setSocket(s);
      if (s.connected) {
        setConnected(true);
        tryRejoin();
      }
    });

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("game_state", onGameState);
      s.off("room_joined", onRoomJoined);
      s.off("error", onError);
      disconnectSocket();
    };
  }, []);

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
              className="pb-[max(1rem,env(safe-area-inset-bottom))]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Lobby
                socket={socket}
                waitingState={gameState?.phase === "waiting" ? gameState : null}
              />
            </motion.div>
          )}

          {connected && inGame && socket && gameState && (
            <motion.div
              key="game"
              className="flex-1 py-2 sm:py-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
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
