"use client";
import { Card } from "./Card";

// Shows the player's privately drawn card + available actions
export default function DrawnCard({
  drawnCard,
  canMatchMarket,
  canMatchWallets,   // array of { playerId, username, topCard }
  onMatchMarket,
  onMatchWallet,
  onThrowDrawn,
  onThrowFromHand,   // signal to player they can throw from hand instead
}) {
  if (!drawnCard) return null;

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 bg-gray-800/80 border border-yellow-400/30 rounded-2xl p-3 sm:p-4 w-full max-w-xs">
      <p className="text-xs text-yellow-400 uppercase tracking-wider font-semibold">You drew</p>

      <Card card={drawnCard} />

      <div className="flex flex-col items-center gap-2 w-full">
        {/* Match market */}
        {canMatchMarket && (
          <button
            onClick={onMatchMarket}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-xl text-sm transition"
          >
            ✅ Match market — collect cards
          </button>
        )}

        {/* Match wallets */}
        {(canMatchWallets || []).map(({ playerId, username, topCard }) => (
          <button
            key={playerId}
            onClick={() => onMatchWallet(playerId)}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 rounded-xl text-sm transition"
          >
            🎯 Steal from {username}'s wallet ({topCard.rank}{topCard.suit})
          </button>
        ))}

        {/* No match options */}
        {!canMatchMarket && (canMatchWallets || []).length === 0 && (
          <p className="text-xs text-gray-500 italic">No matches available</p>
        )}

        {/* Throw drawn card */}
        <button
          onClick={onThrowDrawn}
          className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 font-medium py-2 rounded-xl text-sm transition"
        >
          ❌ Throw this card to market (end turn)
        </button>

        {/* Throw from hand instead */}
        <button
          onClick={onThrowFromHand}
          className="w-full bg-transparent hover:bg-gray-700/50 border border-gray-700 text-gray-400 font-medium py-1.5 rounded-xl text-xs transition"
        >
          Or throw a hand card instead (keep drawn card)
        </button>
      </div>
    </div>
  );
}
