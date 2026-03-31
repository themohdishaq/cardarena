/**
 * VoiceManager — WebRTC mesh for in-room voice chat.
 *
 * Architecture:
 *   - Full mesh: every player opens a direct RTCPeerConnection to every other player
 *   - Signaling (offer/answer/ICE) is relayed through the existing Socket.IO connection
 *   - Server NEVER receives audio — purely peer-to-peer after signaling
 *   - Mic OFF  = stop sending (replaceTrack with silence / remove track)
 *   - Speaker OFF = mute all remote <audio> elements locally
 *
 * Usage:
 *   const vm = new VoiceManager(socket, mySocketId, roomPlayers);
 *   await vm.init();          // request mic permission + start connections
 *   vm.setMic(false);         // mute yourself
 *   vm.setSpeaker(false);     // mute incoming audio
 *   vm.destroy();             // cleanup on unmount
 */

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export class VoiceManager extends EventTarget {
  constructor(socket, myId, players) {
    super();
    this.socket = socket;
    this.myId = myId;
    // Other players we need to connect to
    this.peers = players.filter((p) => p.id !== myId);

    this.localStream = null;          // MediaStream from mic
    this.silentTrack = null;          // AudioTrack of silence (used when muted)
    this._silentCtx = null;           // AudioContext backing silentTrack — kept for cleanup
    this.connections = {};            // peerId -> RTCPeerConnection
    this.remoteAudios = {};           // peerId -> HTMLAudioElement

    this.micOn = true;
    this.speakerOn = true;
    this.initialized = false;
    this.permissionDenied = false;

    this._boundOffer  = this._onOffer.bind(this);
    this._boundAnswer = this._onAnswer.bind(this);
    this._boundIce    = this._onIce.bind(this);
    this._boundLeave  = this._onPeerLeft.bind(this);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async init() {
    // Create the silent track first so it's ready before any peer connections
    const { stream: silentStream, ctx: silentCtx } = this._createSilentStream();
    this.silentTrack = silentStream.getAudioTracks()[0];
    this._silentCtx = silentCtx;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      console.warn("VoiceManager: mic permission denied or unavailable:", err.message);
      this.permissionDenied = true;
      this.localStream = silentStream; // reuse already-created silent stream as fallback
      this.dispatchEvent(new CustomEvent("permission_denied"));
    }

    // Register signaling listeners on the socket
    this.socket.on("webrtc_offer",  this._boundOffer);
    this.socket.on("webrtc_answer", this._boundAnswer);
    this.socket.on("webrtc_ice",    this._boundIce);
    this.socket.on("peer_left",     this._boundLeave);

    // Initiate connections to peers with higher socket IDs (prevents duplicate offers)
    for (const peer of this.peers) {
      if (this.myId < peer.id) {
        await this._createOffer(peer.id);
      }
    }

    this.initialized = true;
    this.dispatchEvent(new CustomEvent("ready"));
  }

  setMic(on) {
    this.micOn = on;
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];

    if (on) {
      // Enable the real track BEFORE pushing it to senders
      if (audioTrack) audioTrack.enabled = true;
      for (const peerId in this.connections) {
        const pc = this.connections[peerId];
        const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
        if (sender && audioTrack) sender.replaceTrack(audioTrack);
      }
    } else {
      // Replace with silence in all connections, then disable real track
      for (const peerId in this.connections) {
        const pc = this.connections[peerId];
        const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
        if (sender && this.silentTrack) sender.replaceTrack(this.silentTrack);
      }
      if (audioTrack) audioTrack.enabled = false;
    }

    this.dispatchEvent(new CustomEvent("mic_change", { detail: { on } }));
  }

  setSpeaker(on) {
    this.speakerOn = on;
    for (const peerId in this.remoteAudios) {
      this.remoteAudios[peerId].muted = !on;
    }
    this.dispatchEvent(new CustomEvent("speaker_change", { detail: { on } }));
  }

  destroy() {
    this.socket.off("webrtc_offer",  this._boundOffer);
    this.socket.off("webrtc_answer", this._boundAnswer);
    this.socket.off("webrtc_ice",    this._boundIce);
    this.socket.off("peer_left",     this._boundLeave);

    for (const peerId in this.connections) {
      this._closePeer(peerId);
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
    }
    if (this.silentTrack) {
      this.silentTrack.stop();
    }
    if (this._silentCtx) {
      this._silentCtx.close();
      this._silentCtx = null;
    }
  }

  // ── Internal — connection management ──────────────────────────────────────

  _createPeerConnection(peerId) {
    if (this.connections[peerId]) return this.connections[peerId];

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.connections[peerId] = pc;

    // Always add the real local track — setMic() will replace it with silence if needed
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    // ICE candidate → relay via socket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("webrtc_ice", { targetId: peerId, candidate: event.candidate });
      }
    };

    // Remote track → attach to hidden <audio> element
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;

      let audio = this.remoteAudios[peerId];
      if (!audio) {
        audio = document.createElement("audio");
        audio.autoplay = true;
        audio.setAttribute("data-peer", peerId);
        document.body.appendChild(audio);
        this.remoteAudios[peerId] = audio;
      }
      audio.srcObject = stream;
      audio.muted = !this.speakerOn;
    };

    pc.onconnectionstatechange = () => {
      this.dispatchEvent(new CustomEvent("peer_state", {
        detail: { peerId, state: pc.connectionState },
      }));
    };

    return pc;
  }

  async _createOffer(peerId) {
    const pc = this._createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.socket.emit("webrtc_offer", {
      targetId: peerId,
      offer: pc.localDescription,
      roomId: null,
    });
  }

  async _onOffer({ fromId, offer }) {
    const pc = this._createPeerConnection(fromId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.socket.emit("webrtc_answer", {
      targetId: fromId,
      answer: pc.localDescription,
    });
  }

  async _onAnswer({ fromId, answer }) {
    const pc = this.connections[fromId];
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async _onIce({ fromId, candidate }) {
    const pc = this.connections[fromId];
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      // Ignore stale ICE candidates
    }
  }

  _onPeerLeft({ peerId }) {
    this._closePeer(peerId);
  }

  _closePeer(peerId) {
    if (this.connections[peerId]) {
      this.connections[peerId].close();
      delete this.connections[peerId];
    }
    if (this.remoteAudios[peerId]) {
      this.remoteAudios[peerId].srcObject = null;
      this.remoteAudios[peerId].remove();
      delete this.remoteAudios[peerId];
    }
    this.dispatchEvent(new CustomEvent("peer_disconnected", { detail: { peerId } }));
  }

  // ── Utility — silent audio stream (used when mic is muted) ────────────────
  _createSilentStream() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = ctx.createMediaStreamDestination();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0; // silence
    oscillator.connect(gain);
    gain.connect(dest);
    oscillator.start();
    return { stream: dest.stream, ctx };
  }
}
