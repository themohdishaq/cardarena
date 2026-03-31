"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { connectSocket } from "../lib/socket";

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(null); // "play"|"create"|"join"
  const socketRef = useRef(null);

  // Pre-fill username from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("username");
    if (saved) setUsername(saved);
  }, []);

  // Setup socket listeners once
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on("game_start", ({ roomId }) => {
      router.push(`/game/${roomId}`);
    });

    socket.on("room_created", ({ code }) => {
      setCreatedCode(code);
      setLoading(null);
    });

    socket.on("room_error", ({ message }) => {
      setError(message);
      setLoading(null);
    });

    socket.on("room_update", ({ players }) => {
      // Waiting in private room — show lobby count, or handle in /waiting
    });

    return () => {
      socket.off("game_start");
      socket.off("room_created");
      socket.off("room_error");
      socket.off("room_update");
    };
  }, [router]);

  function saveUsername() {
    const name = username.trim();
    if (!name) {
      setError("Please enter a username.");
      return null;
    }
    localStorage.setItem("username", name);
    setError("");
    return name;
  }

  function handlePlayNow() {
    const name = saveUsername();
    if (!name) return;
    setLoading("play");
    socketRef.current.emit("join_lobby", { username: name });
    router.push("/waiting");
  }

  function handleCreateRoom() {
    const name = saveUsername();
    if (!name) return;
    setLoading("create");
    socketRef.current.emit("create_room", { username: name });
  }

  function handleJoinRoom() {
    const name = saveUsername();
    if (!name) return;
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("Enter a room code.");
      return;
    }
    setLoading("join");
    socketRef.current.emit("join_room", { code, username: name });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Bazar Game",
    url: "https://bazargame.vercel.app",
    description:
      "Real-time 4-player multiplayer card game. No login, no install. Match cards, steal wallets, and beat your opponents.",
    applicationCategory: "GameApplication",
    genre: "Card Game",
    browserRequirements: "Requires JavaScript. Works in any modern browser.",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 p-6">
      <h1 className="text-5xl font-black tracking-tight text-yellow-400">Card Arena</h1>
      <p className="text-gray-400 text-sm">No login. No install. Just play.</p>

      {/* Username */}
      <div className="w-full max-w-sm flex flex-col gap-2">
        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Action Buttons */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={handlePlayNow}
          disabled={!!loading}
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-3 rounded-xl transition disabled:opacity-50"
        >
          ⚡ {loading === "play" ? "Finding match…" : "Play Now"}
        </button>

        <button
          onClick={handleCreateRoom}
          disabled={!!loading}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-600 font-semibold py-3 rounded-xl transition disabled:opacity-50"
        >
          👥 {loading === "create" ? "Creating…" : "Create Room"}
        </button>

        {/* Created code display */}
        {createdCode && (
          <div className="bg-gray-800 border border-yellow-400 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Share this code with friends</p>
            <p className="text-3xl font-black tracking-widest text-yellow-400">{createdCode}</p>
            <p className="text-xs text-gray-500 mt-1">Game starts when 4 players join</p>
          </div>
        )}

        {/* Join Room */}
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={8}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white uppercase placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition tracking-widest"
          />
          <button
            onClick={handleJoinRoom}
            disabled={!!loading}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            🔑 {loading === "join" ? "…" : "Join"}
          </button>
        </div>
      </div>
    </main>
    </>
  );
}
