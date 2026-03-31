"use client";

/**
 * SpeakingRing — thin animated ring shown around opponent panels when speaking.
 * Wrap any component with this to add a voice activity indicator.
 */
export default function SpeakingRing({ isSpeaking, children }) {
  return (
    <div className={`relative rounded-xl transition-all duration-200 ${
      isSpeaking ? "ring-2 ring-green-400 ring-offset-1 ring-offset-green-950" : ""
    }`}>
      {children}
      {isSpeaking && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-green-950 z-10">
          <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
        </div>
      )}
    </div>
  );
}
