"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LobbyRoom, ClientGameState } from "@/types/game";
import type { GameSocket } from "@/lib/socket";
import { loadPlayerName, savePlayerName } from "@/lib/storage";

interface LobbyProps {
  socket: GameSocket;
  waitingState: ClientGameState | null;
}

type LobbyView = "menu" | "browse" | "waiting";

export default function Lobby({ socket, waitingState }: LobbyProps) {
  const [view, setView] = useState<LobbyView>("menu");
  const [playerName, setPlayerName] = useState(() => loadPlayerName());
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roomId = waitingState?.roomId ?? currentRoom;
  const activeView: LobbyView = waitingState ? "waiting" : view;

  useEffect(() => {
    const onLobbyUpdate = (lobbyRooms: LobbyRoom[]) => {
      setRooms(lobbyRooms);
    };

    const onRoomJoined = (roomId: string) => {
      setCurrentRoom(roomId);
      setView("waiting");
      setError(null);
    };

    const onError = (msg: string) => {
      setError(msg);
    };

    socket.on("lobby_update", onLobbyUpdate);
    socket.on("room_joined", onRoomJoined);
    socket.on("error", onError);

    return () => {
      socket.off("lobby_update", onLobbyUpdate);
      socket.off("room_joined", onRoomJoined);
      socket.off("error", onError);
    };
  }, [socket]);

  const saveName = useCallback(() => {
    if (playerName.trim()) {
      savePlayerName(playerName.trim());
    }
  }, [playerName]);

  const handleCreate = () => {
    saveName();
    socket.emit("create_room", playerName.trim());
  };

  const handleJoin = (roomId: string) => {
    saveName();
    socket.emit("join_room", roomId, playerName.trim());
  };

  const handleAddBot = () => {
    socket.emit("add_bot");
  };

  const handleStart = () => {
    socket.emit("start_game");
  };

  const handleBrowse = () => {
    socket.emit("request_lobby");
    setView("browse");
  };

  const handleCreateFromMenu = () => {
    if (!playerName.trim()) {
      setError("Enter your name");
      return;
    }
    setError(null);
    handleCreate();
  };

  const handleJoinFromMenu = () => {
    if (!playerName.trim()) {
      setError("Enter your name");
      return;
    }
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("Enter a room code");
      return;
    }
    setError(null);
    handleJoin(code);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6">
      <AnimatePresence mode="wait">
        {activeView === "menu" && (
          <MenuView
            key="menu"
            playerName={playerName}
            setPlayerName={setPlayerName}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            onCreateRoom={handleCreateFromMenu}
            onJoinWithCode={handleJoinFromMenu}
            onBrowseClick={() => {
              if (!playerName.trim()) return setError("Enter your name");
              handleBrowse();
            }}
            error={error}
          />
        )}

        {activeView === "browse" && (
          <BrowseView
            key="browse"
            rooms={rooms}
            onBack={() => setView("menu")}
            onJoin={handleJoin}
            onRefresh={handleBrowse}
          />
        )}

        {activeView === "waiting" && waitingState && roomId && (
          <WaitingView
            key="waiting"
            state={waitingState}
            roomId={roomId}
            onAddBot={handleAddBot}
            onStart={handleStart}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuView({
  playerName,
  setPlayerName,
  joinCode,
  setJoinCode,
  onCreateRoom,
  onJoinWithCode,
  onBrowseClick,
  error,
}: {
  playerName: string;
  setPlayerName: (v: string) => void;
  joinCode: string;
  setJoinCode: (v: string) => void;
  onCreateRoom: () => void;
  onJoinWithCode: () => void;
  onBrowseClick: () => void;
  error: string | null;
}) {
  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Mendicot</h2>
        <p className="text-zinc-400">Enter your name, then create or join a room</p>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="player-name" className="sr-only">
            Your name
          </label>
          <input
            id="player-name"
            name="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your name…"
            maxLength={20}
            autoComplete="nickname"
            enterKeyHint="done"
            className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-base text-white placeholder-zinc-500 focus-visible:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-500/25 interactive-focus transition-[border-color,box-shadow]"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onCreateRoom}
          className="w-full min-h-[48px] py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          Create Room
        </button>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300">Join a room</h3>
          <p className="text-xs text-zinc-500">
            Enter the 6-character code the host shared with you.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <label htmlFor="room-code" className="sr-only">
                Room code
              </label>
              <input
                id="room-code"
                name="roomCode"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123…"
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-base text-white placeholder-zinc-500 focus-visible:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/25 interactive-focus font-mono text-center text-lg tracking-widest uppercase"
                onKeyDown={(e) => e.key === "Enter" && onJoinWithCode()}
              />
            </div>
            <button
              type="button"
              onClick={onJoinWithCode}
              className="shrink-0 min-h-[48px] min-w-[48px] px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all"
            >
              Join
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onBrowseClick}
          className="w-full min-h-[48px] py-3.5 bg-white/[0.06] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.1] transition-all"
        >
          Browse open rooms
        </button>
      </div>
    </motion.div>
  );
}

function BrowseView({
  rooms,
  onBack,
  onJoin,
  onRefresh,
}: {
  rooms: LobbyRoom[];
  onBack: () => void;
  onJoin: (roomId: string) => void;
  onRefresh: () => void;
}) {
  const waitingRooms = rooms.filter((r) => r.status === "waiting");

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-2 text-zinc-500 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="min-h-[44px] px-2 text-zinc-500 hover:text-white text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-4">Open Rooms</h3>

      {waitingRooms.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-lg mb-2">No rooms available</p>
          <p className="text-sm">Create one and invite your friends!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {waitingRooms.map((room) => (
            <button
              key={room.roomId}
              onClick={() => onJoin(room.roomId)}
              className="w-full flex items-center justify-between p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl hover:border-white/[0.15] hover:bg-white/[0.06] transition-all text-left"
            >
              <div>
                <div className="font-medium text-white">{room.hostName}&apos;s room</div>
                <div className="text-xs text-zinc-500 font-mono">{room.roomId}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">
                  {room.playerCount}/{room.maxPlayers}
                </span>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-md font-medium">
                  Join
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function WaitingView({
  state,
  roomId,
  onAddBot,
  onStart,
}: {
  state: ClientGameState;
  roomId: string;
  onAddBot: () => void;
  onStart: () => void;
}) {
  const playerCount = state.players.length;
  const canStart = playerCount === 4;

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-1">Waiting for players</h3>
        <div className="flex items-center justify-center gap-2">
          <span className="text-zinc-500 text-sm">Room code:</span>
          <span className="font-mono text-amber-400 text-lg font-bold tracking-widest">
            {roomId}
          </span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-zinc-500 hover:text-white transition-colors rounded-lg"
            aria-label="Copy room code"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Player slots */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => {
          const player = state.players[i];
          return (
            <div
              key={i}
              className={`
                p-4 rounded-xl border text-center
                ${player
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-white/[0.02] border-white/[0.06] border-dashed"
                }
              `}
            >
              {player ? (
                <>
                  <div className="text-white font-medium text-sm">{player.name}</div>
                  <div className={`text-[10px] mt-0.5 ${player.team === 0 ? "text-emerald-400" : "text-blue-400"}`}>
                    Team {player.team + 1}
                  </div>
                </>
              ) : (
                <div className="text-zinc-600 text-sm">Empty</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {playerCount < 4 && (
        <button
          onClick={onAddBot}
          className="w-full min-h-[48px] py-3 bg-white/[0.06] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.1] transition-all text-sm"
        >
            + Add Bot
          </button>
        )}

        <button
          onClick={canStart ? onStart : undefined}
          disabled={!canStart}
          className={`
            w-full min-h-[48px] py-3.5 font-bold rounded-xl transition-all text-sm
            ${canStart
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.01]"
              : "bg-white/[0.04] text-zinc-600 cursor-not-allowed"
            }
          `}
        >
          {canStart ? "Start Game" : `Waiting for ${4 - playerCount} more player${4 - playerCount > 1 ? "s" : ""}...`}
        </button>
      </div>
    </motion.div>
  );
}
