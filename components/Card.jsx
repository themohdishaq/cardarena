"use client";

const SUIT_COLORS = {
  "♠": "text-gray-900",
  "♣": "text-gray-900",
  "♥": "text-red-600",
  "♦": "text-red-600",
};

export function Card({ card, selected, onClick, faceDown = false, small = false, locked = false }) {
  const sizeClass = small
    ? "w-8 h-[46px] text-[9px] rounded"
    : "w-11 h-16 sm:w-16 sm:h-24 text-xs sm:text-base rounded-md sm:rounded-lg";

  if (faceDown) {
    return (
      <div
        className={`${sizeClass} bg-blue-900 border-2 border-blue-700 flex items-center justify-center select-none`}
        style={{ backgroundImage: "repeating-linear-gradient(45deg,#1e3a5f,#1e3a5f 4px,#1a3255 4px,#1a3255 8px)" }}
      />
    );
  }

  const suitColor = SUIT_COLORS[card?.suit] || "text-gray-900";

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        ${sizeClass} bg-white border-2 flex flex-col items-start justify-between p-1
        transition-all duration-150 select-none font-bold
        ${locked ? "border-yellow-500 ring-2 ring-yellow-400/50 opacity-80 cursor-default" : ""}
        ${selected
          ? "border-yellow-400 shadow-lg shadow-yellow-400/40 -translate-y-3 scale-105"
          : onClick && !locked
            ? "border-gray-300 hover:border-yellow-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
            : "border-gray-300 cursor-default"
        }
      `}
    >
      <span className={`${suitColor} leading-none text-[9px] sm:text-sm`}>{card?.rank}</span>
      <span className={`${suitColor} text-sm sm:text-xl leading-none self-center`}>{card?.suit}</span>
      <span className={`${suitColor} leading-none text-[9px] sm:text-sm self-end rotate-180`}>{card?.rank}</span>
    </button>
  );
}

export function DeckPile({ count, onClick, disabled }) {
  const canClick = onClick && !disabled && count > 0;
  return (
    <button
      onClick={canClick ? onClick : undefined}
      className={`relative w-11 h-16 sm:w-16 sm:h-24 transition-all duration-150 ${canClick ? "hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer" : "cursor-default opacity-60"}`}
    >
      {[2, 1].map((i) => (
        <div key={i} className="absolute inset-0 rounded-xl bg-blue-900 border border-blue-700"
          style={{ transform: `translate(${i}px,${-i}px)` }} />
      ))}
      <div className="absolute inset-0 rounded-xl bg-blue-800 border-2 border-blue-600 flex flex-col items-center justify-center gap-0.5"
        style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.03) 4px,rgba(255,255,255,0.03) 8px)" }}>
        <span className="text-white font-black text-lg leading-none">{count}</span>
        <span className="text-blue-400 text-[10px] uppercase tracking-wider">cards</span>
      </div>
    </button>
  );
}
