"use client";

export default function StatusBar({ gameState, myId }) {
  if (!gameState) return null;
  const activePlayer = gameState.players?.[gameState.turn];
  const isMyTurn = activePlayer?.id === myId;

  return (
    <div className="flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-900 border-b border-gray-800 text-xs sm:text-sm gap-2">
      <span className="text-gray-400 flex-shrink-0">
        R<span className="text-white font-semibold">{gameState.round}</span>
      </span>
      <span className={`font-semibold truncate text-center flex-1 ${isMyTurn ? "text-yellow-400" : "text-gray-300"}`}>
        {isMyTurn ? "⚡ Your Turn" : `${activePlayer?.username ?? "…"}'s Turn`}
      </span>
      <div className="flex items-center gap-2 text-gray-400 flex-shrink-0">
        {gameState.phase === "endgame" && (
          <span className="text-orange-400 text-[10px] font-semibold uppercase">End</span>
        )}
        <span className="flex-shrink-0">🂠<span className="text-white font-semibold">{gameState.deckCount ?? 0}</span></span>
      </div>
    </div>
  );
}
