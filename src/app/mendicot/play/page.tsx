"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import { connectSocket, disconnectSocket, type GameSocket } from "@/lib/socket";
import { shouldClearSessionOnRejoinError } from "@/lib/rejoin";
import {
  loadMendicotSession,
  saveMendicotSession,
  clearMendicotSession,
} from "@/lib/storage";
import type { ClientGameState, Card } from "@/types/game";

const Lobby = dynamic(() => import("@/components/Lobby"), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const GameBoard = dynamic(() => import("@/components/GameBoard"), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function PlayPage() {
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const pendingRejoin = useRef(false);

  const inGame = gameState !== null && gameState.phase !== "waiting";
  const showConnectingScreen = !connected && gameState === null;
  const isReconnecting = !connected && gameState !== null;
  const canShowApp = connected || gameState !== null;

  useEffect(() => {
    const s = connectSocket();

    const tryRejoin = () => {
      const session = loadMendicotSession();
      if (!session) return;
      pendingRejoin.current = true;
      s.emit("rejoin_room", session.roomId, session.playerId);
    };

    const onConnect = () => {
      setConnectionError(null);
      setConnected(true);
      tryRejoin();
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err: Error) => {
      setConnectionError(
        err.message || "Could not reach the game server. Check your connection and try again."
      );
    };

    const onGameState = (state: ClientGameState, playerHand: Card[]) => {
      pendingRejoin.current = false;
      setGameState(state);
      setHand(playerHand);
      const id = state.players[state.myIndex]?.id;
      if (id && state.roomId) {
        saveMendicotSession({ roomId: state.roomId, playerId: id });
      }
    };

    const onRoomJoined = (roomId: string, _playerIndex: number, playerId: string) => {
      pendingRejoin.current = false;
      saveMendicotSession({ roomId, playerId });
    };

    const onError = (msg: string) => {
      if (pendingRejoin.current && shouldClearSessionOnRejoinError(msg)) {
        clearMendicotSession();
        pendingRejoin.current = false;
      }
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);
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
      s.off("connect_error", onConnectError);
      s.off("game_state", onGameState);
      s.off("room_joined", onRoomJoined);
      s.off("error", onError);
      disconnectSocket();
    };
  }, []);

  return (
    <div
      className={
        inGame
          ? "h-dvh max-h-dvh flex flex-col overflow-hidden play-surface"
          : "min-h-dvh flex flex-col"
      }
    >
      <Navbar compact={inGame} />

      <div className="flex justify-center pt-1 sm:pt-2">
        {!inGame || !connected ? (
          <div
            role="status"
            aria-live="polite"
            className={`
              inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
              ${connected
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : isReconnecting
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
              }
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected
                  ? "bg-emerald-400"
                  : isReconnecting
                  ? "bg-amber-400 animate-pulse"
                  : "bg-red-400 animate-pulse"
              }`}
              aria-hidden="true"
            />
            {connected ? "Connected" : isReconnecting ? "Reconnecting…" : "Connecting…"}
          </div>
        ) : null}
      </div>

      <main id="main-content" className="flex-1 flex flex-col min-h-0">
        {showConnectingScreen ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6 max-w-sm">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-400">Connecting to game server…</p>
              {connectionError ? (
                <p className="text-red-400 text-sm mt-3">{connectionError}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {canShowApp && !inGame && socket ? (
          <div className="pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Lobby
              socket={socket}
              waitingState={gameState?.phase === "waiting" ? gameState : null}
            />
          </div>
        ) : null}

        {canShowApp && inGame && socket && gameState ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden play-surface">
            <GameBoard socket={socket} state={gameState} hand={hand} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
