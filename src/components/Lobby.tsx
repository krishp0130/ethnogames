"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LobbyRoom, ClientGameState, Card } from "@/types/game";
import type { GameSocket } from "@/lib/socket";

interface LobbyProps {
  socket: GameSocket;
  onGameStart: (state: ClientGameState, hand: Card[]) => void;
}

type LobbyView = "menu" | "create" | "browse" | "waiting";

export default function Lobby({ socket, onGameStart }: LobbyProps) {
  const [view, setView] = useState<LobbyView>("menu");
  const [playerName, setPlayerName] = useState("");
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [waitingState, setWaitingState] = useState<ClientGameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("ethnogames_name");
    if (savedName) setPlayerName(savedName);
  }, []);

  useEffect(() => {
    socket.on("lobby_update", (lobbyRooms) => {
      setRooms(lobbyRooms);
    });

    socket.on("room_joined", (roomId) => {
      setCurrentRoom(roomId);
      setView("waiting");
      setError(null);
    });

    socket.on("game_state", (state, hand) => {
      if (state.phase === "waiting") {
        setWaitingState(state);
      } else {
        onGameStart(state, hand);
      }
    });

    socket.on("error", (msg) => {
      setError(msg);
    });

    return () => {
      socket.off("lobby_update");
      socket.off("room_joined");
      socket.off("game_state");
      socket.off("error");
    };
  }, [socket, onGameStart]);

  const saveName = useCallback(() => {
    if (playerName.trim()) {
      localStorage.setItem("ethnogames_name", playerName.trim());
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

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {view === "menu" && (
          <MenuView
            key="menu"
            playerName={playerName}
            setPlayerName={setPlayerName}
            onCreateClick={() => {
              if (!playerName.trim()) return setError("Enter your name");
              setView("create");
            }}
            onBrowseClick={() => {
              if (!playerName.trim()) return setError("Enter your name");
              handleBrowse();
            }}
            error={error}
          />
        )}

        {view === "create" && (
          <CreateView
            key="create"
            playerName={playerName}
            onBack={() => setView("menu")}
            onCreate={handleCreate}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            onJoinDirect={() => {
              if (joinCode.trim()) handleJoin(joinCode.trim().toUpperCase());
            }}
            error={error}
          />
        )}

        {view === "browse" && (
          <BrowseView
            key="browse"
            rooms={rooms}
            onBack={() => setView("menu")}
            onJoin={handleJoin}
            onRefresh={handleBrowse}
          />
        )}

        {view === "waiting" && waitingState && (
          <WaitingView
            key="waiting"
            state={waitingState}
            roomId={currentRoom!}
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
  onCreateClick,
  onBrowseClick,
  error,
}: {
  playerName: string;
  setPlayerName: (v: string) => void;
  onCreateClick: () => void;
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
        <p className="text-zinc-400">Enter your name to get started</p>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Your name"
          maxLength={20}
          className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
          onKeyDown={(e) => e.key === "Enter" && onCreateClick()}
        />

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          onClick={onCreateClick}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          Create Room
        </button>

        <button
          onClick={onBrowseClick}
          className="w-full py-3.5 bg-white/[0.06] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.1] transition-all"
        >
          Browse Rooms
        </button>
      </div>
    </motion.div>
  );
}

function CreateView({
  playerName,
  onBack,
  onCreate,
  joinCode,
  setJoinCode,
  onJoinDirect,
  error,
}: {
  playerName: string;
  onBack: () => void;
  onCreate: () => void;
  joinCode: string;
  setJoinCode: (v: string) => void;
  onJoinDirect: () => void;
  error: string | null;
}) {
  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <button
        onClick={onBack}
        className="text-zinc-500 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors"
      >
        ← Back
      </button>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Create a new room</h3>
          <p className="text-zinc-400 text-sm mb-4">
            Playing as <span className="text-white font-medium">{playerName}</span>
          </p>
          <button
            onClick={onCreate}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
          >
            Create Room
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.06]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-3 text-zinc-500">or join with code</span>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={6}
            className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 font-mono text-center text-lg tracking-widest uppercase"
            onKeyDown={(e) => e.key === "Enter" && onJoinDirect()}
          />
          <button
            onClick={onJoinDirect}
            className="px-6 py-3 bg-white/[0.08] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.12] transition-all"
          >
            Join
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
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
          onClick={onBack}
          className="text-zinc-500 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onRefresh}
          className="text-zinc-500 hover:text-white text-sm transition-colors"
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
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="text-zinc-500 hover:text-white transition-colors"
            title="Copy code"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            className="w-full py-3 bg-white/[0.06] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.1] transition-all text-sm"
          >
            + Add Bot
          </button>
        )}

        <button
          onClick={handleStartClick}
          disabled={!canStart}
          className={`
            w-full py-3.5 font-bold rounded-xl transition-all text-sm
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

  function handleStartClick() {
    if (canStart) onStart();
  }
}
