import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000",
      {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
      }
    );
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}
