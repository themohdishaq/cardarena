"use client";
import { Card } from "./Card";

// Shows a player's wallet pile — only top card visible
// onSteal: if provided, clicking steals the top card
export default function WalletPile({ topCard, size, lockedCount, onSteal, canSteal, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label ?? "wallet"}</span>

      <div className="relative">
        {/* Stack depth indicators */}
        {size > 1 && (
          <>
            <div className="absolute inset-0 rounded-lg bg-gray-700 border border-gray-600"
              style={{ transform: "translate(3px,-3px)" }} />
            {size > 2 && (
              <div className="absolute inset-0 rounded-lg bg-gray-800 border border-gray-700"
                style={{ transform: "translate(6px,-6px)" }} />
            )}
          </>
        )}

        {topCard ? (
          <div className="relative z-10">
            <Card
              card={topCard}
              onClick={canSteal ? onSteal : null}
              selected={false}
            />
            {canSteal && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold animate-pulse">
                !
              </div>
            )}
          </div>
        ) : (
          <div className="w-11 h-16 sm:w-16 sm:h-24 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center">
            <span className="text-gray-700 text-xs">empty</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400">{size} cards</span>
        {lockedCount > 0 && (
          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">
            🔒 ×{lockedCount}
          </span>
        )}
      </div>
    </div>
  );
}
