"use client";

/**
 * VoiceBar — compact horizontal strip shown at the bottom of the game screen.
 * Shows all 4 players with their mic/speaker status and speaking animations.
 */
export default function VoiceBar({
  players,
  myId,
  micOn,
  speakerOn,
  toggleMic,
  toggleSpeaker,
  speaking,           // { [peerId]: bool, self: bool }
  peerStates,         // { [peerId]: "connected"|"connecting"|... }
  permissionDenied,
  voiceReady,
}) {
  const isSelfSpeaking = speaking?.self && micOn;

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-900 border-t border-gray-800">
      {/* Player voice indicators */}
      <div className="flex items-center gap-2 flex-1 overflow-x-auto">
        {(players || []).map((p) => {
          const isMe = p.id === myId;
          const isSpeaking = isMe ? isSelfSpeaking : speaking?.[p.id];
          const peerConn = peerStates?.[p.id];
          const isConnected = isMe || peerConn === "connected";

          return (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg flex-shrink-0 transition-all duration-200 ${
                isSpeaking
                  ? "bg-green-500/20 ring-1 ring-green-400/60"
                  : "bg-gray-800"
              }`}
            >
              {/* Speaking pulse ring */}
              <div className="relative flex-shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${isSpeaking ? "bg-green-500 text-white" : isConnected ? "bg-gray-700 text-gray-300" : "bg-gray-800 text-gray-600"}
                  ${isSpeaking ? "ring-2 ring-green-400 ring-offset-1 ring-offset-gray-900" : ""}
                `}>
                  {p.username?.[0]?.toUpperCase() ?? "?"}
                </div>
                {isSpeaking && (
                  <span className="absolute inset-0 rounded-full bg-green-400 opacity-40 animate-ping" />
                )}
              </div>

              {/* Username */}
              <span className={`text-xs font-medium leading-none ${isMe ? "text-yellow-400" : "text-gray-300"}`}>
                {p.username}{isMe ? " (you)" : ""}
              </span>

              {/* Connection dot for peers */}
              {!isMe && (
                <span
                  title={peerConn ?? "connecting…"}
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    peerConn === "connected" ? "bg-green-500" :
                    peerConn === "failed" || peerConn === "disconnected" ? "bg-red-500" :
                    "bg-yellow-500 animate-pulse"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* My controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {permissionDenied && (
          <span className="text-[10px] text-orange-400 max-w-20 text-center leading-tight">
            mic blocked
          </span>
        )}

        {/* Mic toggle */}
        <button
          onClick={toggleMic}
          disabled={permissionDenied}
          title={micOn ? "Mute microphone" : "Unmute microphone"}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-150 relative
            ${micOn
              ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/30"
              : "bg-gray-700 hover:bg-gray-600 text-gray-400"
            }
            ${permissionDenied ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {micOn ? "🎤" : "🔇"}
          {/* Active pulse ring */}
          {micOn && isSelfSpeaking && (
            <span className="absolute inset-0 rounded-xl ring-2 ring-green-400 animate-ping opacity-60" />
          )}
        </button>

        {/* Speaker toggle */}
        <button
          onClick={toggleSpeaker}
          title={speakerOn ? "Mute speakers" : "Unmute speakers"}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-150
            ${speakerOn
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30"
              : "bg-gray-700 hover:bg-gray-600 text-gray-400"
            }
          `}
        >
          {speakerOn ? "🔊" : "🔈"}
        </button>

        {/* Voice status badge */}
        <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          !voiceReady ? "bg-yellow-500/20 text-yellow-400" :
          permissionDenied ? "bg-orange-500/20 text-orange-400" :
          "bg-green-500/20 text-green-400"
        }`}>
          {!voiceReady ? "connecting…" : permissionDenied ? "no mic" : "live"}
        </div>
      </div>
    </div>
  );
}
