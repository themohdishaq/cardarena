"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "../../lib/socket";

export default function WaitingPage() {
  const router = useRouter();
  const [count, setCount] = useState(1);

  useEffect(() => {
    const socket = getSocket();

    socket.on("waiting_update", ({ count }) => setCount(count));

    socket.on("game_start", ({ roomId }) => {
      router.push(`/game/${roomId}`);
    });

    return () => {
      socket.off("waiting_update");
      socket.off("game_start");
    };
  }, [router]);

  function handleCancel() {
    router.push("/");
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h2 className="text-3xl font-bold text-yellow-400">Finding Players…</h2>

      {/* Spinner */}
      <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />

      {/* Player dots */}
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              i < count
                ? "bg-yellow-400 border-yellow-400 text-gray-900"
                : "bg-gray-800 border-gray-700 text-gray-600"
            }`}
          >
            {i < count ? "✓" : "?"}
          </div>
        ))}
      </div>

      <p className="text-gray-400 text-sm">
        {count}/4 players in queue
      </p>

      <button
        onClick={handleCancel}
        className="mt-4 text-gray-500 hover:text-gray-300 text-sm underline transition"
      >
        Cancel
      </button>
    </main>
  );
}
