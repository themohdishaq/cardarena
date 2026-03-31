"use client";
import { Card } from "./Card";

export default function PlayerHand({ hand, selectedIndex, onSelectCard, isMyTurn, phase, throwingFromHand }) {
  let label = "Waiting…";
  if (isMyTurn) {
    if (phase === "endgame") {
      label = "Throw a card";
    } else if (throwingFromHand) {
      label = "Throw a hand card";
    } else {
      label = "Tap to play from hand";
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full transition ${
        isMyTurn ? "bg-yellow-400 text-gray-900" : "bg-gray-800 text-gray-400"
      }`}>
        {label}
      </div>

      <div className="flex gap-1.5 sm:gap-2">
        {(hand || []).map((card, i) => (
          <Card
            key={card.id}
            card={card}
            selected={selectedIndex === i}
            onClick={isMyTurn ? () => onSelectCard(i) : null}
          />
        ))}
        {(!hand || hand.length === 0) && (
          <div className="text-gray-600 text-sm italic">No cards in hand</div>
        )}
      </div>
    </div>
  );
}
