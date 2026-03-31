"use client";

export default function Deck({ count, onDraw, isMyTurn }) {
  const canDraw = isMyTurn && count > 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={canDraw ? onDraw : undefined}
        disabled={!canDraw}
        className={`relative w-11 h-16 sm:w-16 sm:h-24 rounded-xl transition-all duration-150 ${
          canDraw
            ? "hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer"
            : "cursor-default opacity-75"
        }`}
        title={canDraw ? "Draw a card to the market" : count === 0 ? "Deck empty" : "Not your turn"}
      >
        {/* Stack layers */}
        {[2, 1].map((offset) => (
          <div
            key={offset}
            className="absolute inset-0 rounded-xl bg-blue-900 border border-blue-700"
            style={{ transform: `translate(${offset}px, ${-offset}px)` }}
          />
        ))}
        {/* Top card */}
        <div
          className="absolute inset-0 rounded-xl bg-blue-800 border-2 border-blue-600 flex flex-col items-center justify-center gap-1"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.03) 4px,rgba(255,255,255,0.03) 8px)",
          }}
        >
          <span className="text-white font-black text-sm sm:text-lg leading-none">{count}</span>
          <span className="text-blue-400 text-[10px] uppercase tracking-wider">cards</span>
        </div>
      </button>

      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Deck</span>
    </div>
  );
}
