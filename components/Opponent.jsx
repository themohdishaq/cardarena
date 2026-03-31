"use client";
import { Card } from "./Card";
import WalletPile from "./WalletPile";
import SpeakingRing from "./SpeakingRing";

export default function Opponent({
  player, cardCount,
  walletTop, walletSize, lockedCount,
  isActive, onStealWallet, canSteal,
  isSpeaking,
  compact = false,
}) {
  // Compact variant — used in the mobile opponent strip at the top
  if (compact) {
    return (
      <SpeakingRing isSpeaking={isSpeaking}>
        <div className={"flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all " +
          (isActive ? "bg-yellow-400/10 ring-1 ring-yellow-400" : "bg-gray-900/40")}>

          <div className="flex items-center gap-1">
            {isActive && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse flex-shrink-0" />}
            <span className="text-[10px] font-semibold text-white truncate max-w-[60px]">{player.username}</span>
          </div>

          {/* Wallet top card — tappable to steal */}
          <div className="relative">
            {walletTop ? (
              <>
                <Card card={walletTop} small onClick={canSteal ? onStealWallet : null} />
                {canSteal && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold animate-pulse">!</div>
                )}
              </>
            ) : (
              <div className="w-8 h-[46px] rounded border border-dashed border-gray-700 flex items-center justify-center">
                <span className="text-gray-700 text-[8px]">—</span>
              </div>
            )}
          </div>

          <span className="text-[9px] text-gray-500">{cardCount}h · {walletSize}w</span>
        </div>
      </SpeakingRing>
    );
  }

  // Full variant — used on desktop
  return (
    <SpeakingRing isSpeaking={isSpeaking}>
      <div className={"flex flex-col items-center gap-2 p-3 rounded-xl transition-all " +
        (isActive ? "bg-yellow-400/10 ring-1 ring-yellow-400" : "")}>

        <div className="flex items-center gap-2">
          {isActive && <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
          <span className="text-sm font-medium text-white">{player.username}</span>
          {isSpeaking && (
            <span className="text-[10px] text-green-400 animate-pulse font-semibold">speaking</span>
          )}
        </div>

        <div className="flex gap-3 items-end">
          {/* Face-down hand cards */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1">
              {Array.from({ length: cardCount }).map((_, i) => (
                <Card key={i} faceDown small />
              ))}
              {cardCount === 0 && <span className="text-xs text-gray-600">no hand</span>}
            </div>
            <span className="text-[10px] text-gray-600">{cardCount} in hand</span>
          </div>

          {/* Wallet */}
          <WalletPile
            topCard={walletTop}
            size={walletSize ?? 0}
            lockedCount={lockedCount ?? 0}
            onSteal={onStealWallet}
            canSteal={canSteal}
          />
        </div>
      </div>
    </SpeakingRing>
  );
}
