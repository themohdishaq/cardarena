"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VoiceManager } from "./voice";

/**
 * useVoice — React hook wrapping VoiceManager.
 *
 * @param {object} socket  - Socket.IO socket instance
 * @param {string} myId    - This player's socket ID
 * @param {Array}  players - All players in the room [{ id, username }]
 * @param {string} roomId  - Room ID (used for broadcasting voice state)
 *
 * Returns:
 *   micOn        boolean   - Whether this player's mic is active
 *   speakerOn    boolean   - Whether incoming audio is audible
 *   toggleMic    fn        - Toggle mic on/off
 *   toggleSpeaker fn       - Toggle speaker on/off
 *   speaking     object    - { [peerId]: boolean } — who is currently speaking
 *   peerStates   object    - { [peerId]: "connected"|"connecting"|... }
 *   permissionDenied bool  - Mic permission was refused
 *   voiceReady   bool      - WebRTC connections established
 */
export function useVoice(socket, myId, players, roomId) {
  const managerRef = useRef(null);
  const rafRef = useRef(null);
  const speakingCtxRef = useRef(null); // AudioContext for speaking detection — kept for cleanup

  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [speaking, setSpeaking] = useState({});         // peerId -> bool
  const [peerStates, setPeerStates] = useState({});
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);

  // ── Init voice manager once players list is stable ─────────────────────────
  useEffect(() => {
    if (!socket || !myId || !players?.length || !roomId) return;
    if (managerRef.current) return; // already initialized

    const vm = new VoiceManager(socket, myId, players);
    managerRef.current = vm;

    vm.addEventListener("ready", () => setVoiceReady(true));
    vm.addEventListener("permission_denied", () => setPermissionDenied(true));

    vm.addEventListener("peer_state", (e) => {
      const { peerId, state } = e.detail;
      setPeerStates((prev) => ({ ...prev, [peerId]: state }));
    });

    // mic_change is the single source of truth — don't duplicate in toggleMic
    vm.addEventListener("mic_change", (e) => {
      setMicOn(e.detail.on);
      socket.emit("voice_state", { roomId, micOn: e.detail.on });
      // Clear self-speaking indicator immediately when muting
      if (!e.detail.on) {
        setSpeaking((prev) => ({ ...prev, self: false }));
      }
    });

    vm.addEventListener("speaker_change", (e) => {
      setSpeakerOn(e.detail.on);
    });

    vm.addEventListener("peer_disconnected", (e) => {
      const { peerId } = e.detail;
      setSpeaking((prev) => { const n = { ...prev }; delete n[peerId]; return n; });
      setPeerStates((prev) => { const n = { ...prev }; delete n[peerId]; return n; });
    });

    vm.init().then(() => {
      // Start local speaking detection (volume analysis)
      if (vm.localStream && !vm.permissionDenied) {
        _startSpeakingDetection(vm.localStream);
      }
    });

    // Listen for other players' mic state broadcast
    const onPeerVoiceState = ({ peerId, micOn: peerMicOn }) => {
      if (!peerMicOn) {
        setSpeaking((prev) => ({ ...prev, [peerId]: false }));
      }
    };
    socket.on("peer_voice_state", onPeerVoiceState);

    return () => {
      socket.off("peer_voice_state", onPeerVoiceState);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (speakingCtxRef.current) {
        speakingCtxRef.current.close();
        speakingCtxRef.current = null;
      }
      vm.destroy();
      managerRef.current = null;
    };
  }, [socket, myId, players, roomId]);

  // ── Speaking detection via Web Audio API analyser ─────────────────────────
  function _startSpeakingDetection(stream) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      speakingCtxRef.current = ctx;

      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      src.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const THRESHOLD = 20; // 0-255, tune sensitivity here

      function tick() {
        // Don't report speaking when mic is muted
        if (!managerRef.current?.micOn) {
          setSpeaking((prev) => (prev["self"] === false ? prev : { ...prev, self: false }));
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const isSpeaking = avg > THRESHOLD;
        setSpeaking((prev) => {
          if (prev["self"] === isSpeaking) return prev;
          return { ...prev, self: isSpeaking };
        });
        rafRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch (e) {
      console.warn("Speaking detection unavailable:", e);
    }
  }

  // ── Controls ───────────────────────────────────────────────────────────────
  // vm.setMic() dispatches mic_change which handles setMicOn + socket emit —
  // don't duplicate those calls here or they fire twice.
  const toggleMic = useCallback(() => {
    const vm = managerRef.current;
    if (!vm) return;
    vm.setMic(!micOn);
  }, [micOn]);

  const toggleSpeaker = useCallback(() => {
    const vm = managerRef.current;
    if (!vm) return;
    vm.setSpeaker(!speakerOn);
    // speaker_change event handles setSpeakerOn
  }, [speakerOn]);

  return {
    micOn,
    speakerOn,
    toggleMic,
    toggleSpeaker,
    speaking,
    peerStates,
    permissionDenied,
    voiceReady,
  };
}
