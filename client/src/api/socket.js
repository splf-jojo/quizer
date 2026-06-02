import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export function createRoomSocket({ roomCode, participantId, token }) {
  return io(SOCKET_URL, {
    auth: {
      roomCode,
      participantId,
      token
    },
    transports: ["websocket"]
  });
}
