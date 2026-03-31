"use client";
import { Card } from "./Card";

export default function Market({ cards, drawnCardRank, highlightMatches }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-gray-400 uppercase tracking-wider">Market</p>
      <div className="flex gap-1.5 sm:gap-3">
        {(cards || []).map((card, i) => {
          const isMatch = highlightMatches && drawnCardRank && card.rank === drawnCardRank;
          return (
            <div key={card.id} className="flex flex-col items-center gap-1">
              <Card card={card} selected={isMatch} />
              {isMatch && (
                <span className="text-[10px] text-green-400 font-semibold animate-pulse">match!</span>
              )}
            </div>
          );
        })}
        {(!cards || cards.length === 0) && (
          <div className="w-11 h-16 sm:w-16 sm:h-24 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center">
            <span className="text-gray-700 text-xs">empty</span>
          </div>
        )}
      </div>
    </div>
  );
}
