"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getSocket } from "../../../lib/socket";
import { useVoice } from "../../../lib/useVoice";
import GameTable from "../../../components/GameTable";
import StatusBar from "../../../components/StatusBar";
import VoiceBar from "../../../components/VoiceBar";

export default function GamePage() {
  const { roomId } = useParams();
  const [gameState, setGameState] = useState(null);
  const [myId, setMyId] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // Voice — initialises once players list arrives from first game_state
  const players = gameState?.players ?? [];
  const {
    micOn, speakerOn,
    toggleMic, toggleSpeaker,
    speaking, peerStates,
    permissionDenied, voiceReady,
  } = useVoice(socketRef.current, myId, players, roomId);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    setMyId(socket.id);

    socket.on("game_state", (state) => setGameState(state));
    socket.on("game_update", (state) => setGameState(state));
    socket.on("turn_change", ({ turn }) =>
      setGameState((prev) => prev ? { ...prev, turn } : prev)
    );
    socket.on("game_end", (result) => setGameOver(result));
    socket.on("action_error", ({ message }) => setError(message));
    socket.on("player_disconnected", ({ playerId }) =>
      setError("A player disconnected (" + playerId.slice(0, 6) + "…)")
    );

    // Request current state immediately — handles the race condition where
    // the server's initial game_state event fired before this page mounted
    socket.emit("request_game_state", { roomId });

    return () => {
      socket.off("game_state");
      socket.off("game_update");
      socket.off("turn_change");
      socket.off("game_end");
      socket.off("action_error");
      socket.off("player_disconnected");
    };
  }, [roomId]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(t);
  }, [error]);

  if (gameOver) {
    const sorted = [...(gameOver.players || [])].sort(
      (a, b) => (gameOver.scores?.[b.id] ?? 0) - (gameOver.scores?.[a.id] ?? 0)
    );
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 bg-gray-950">
        <h2 className="text-4xl font-black text-yellow-400">Game Over!</h2>
        <p className="text-xl text-white">
          🏆 {gameOver.winner?.username ?? "Unknown"} wins!
        </p>
        <div className="w-full max-w-xs bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
          <div className="px-4 py-2 bg-gray-800 text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Final Scores
          </div>
          {sorted.map((p, i) => (
            <div key={p.id} className={"flex items-center justify-between px-4 py-3 border-b border-gray-800 last:border-0 " + (p.id === gameOver.winner?.id ? "bg-yellow-400/10" : "")}>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm w-4">{i + 1}.</span>
                <span className="text-white font-medium">{p.username}</span>
                {p.id === gameOver.winner?.id && <span className="text-yellow-400 text-sm">👑</span>}
              </div>
              <span className="text-yellow-400 font-bold">{gameOver.scores?.[p.id] ?? 0} pts</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 text-center">
          2–9 = 5pts · 10/J/Q/K = 10pts · Ace = 20pts
        </div>
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition"
        >
          Play Again
        </button>
      </main>
    );
  }

  if (!gameState) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-gray-400">Loading game…</div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-green-950">
      <StatusBar gameState={gameState} myId={myId} />

      {error && (
        <div className="mx-4 mt-2 px-4 py-2 bg-red-900/80 border border-red-700 rounded-lg text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <GameTable
          gameState={gameState}
          roomId={roomId}
          myId={myId}
          speaking={speaking}
        />
      </div>

      <VoiceBar
        players={gameState.players}
        myId={myId}
        micOn={micOn}
        speakerOn={speakerOn}
        toggleMic={toggleMic}
        toggleSpeaker={toggleSpeaker}
        speaking={speaking}
        peerStates={peerStates}
        permissionDenied={permissionDenied}
        voiceReady={voiceReady}
      />
    </main>
  );
}
