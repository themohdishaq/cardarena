"use client";

export default function TurnIndicator({ players, currentTurn, myId }) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {(players || []).map((player, i) => {
        const isActive = i === currentTurn;
        const isMe = player.id === myId;
        return (
          <div
            key={player.id}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              isActive
                ? "bg-yellow-400 text-gray-900 turn-active"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {isActive && <span className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-ping" />}
            {player.username}
            {isMe && <span className="opacity-60">(you)</span>}
          </div>
        );
      })}
    </div>
  );
}
