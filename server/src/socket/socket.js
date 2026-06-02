import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { httpError } from "../utils/httpError.js";
import { listParticipants, setParticipantConnected, validateParticipantForRoom } from "../services/participant.service.js";
import { requireRoomByCode, roomStatePayload } from "../services/room.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_later";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

let ioInstance = null;
const participantSockets = new Map();

function emitToRoom(code, eventName, payload) {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(code).emit(eventName, payload);
}

async function authenticateSocket(socket) {
  const { participantId, roomCode, token } = socket.handshake.auth || {};

  if (!roomCode) {
    throw httpError(401, "roomCode is required");
  }

  await requireRoomByCode(roomCode);

  if (participantId) {
    const participant = await validateParticipantForRoom(participantId, roomCode);
    return {
      roomCode,
      participantId,
      role: participant.roleInRoom
    };
  }

  if (token) {
    try {
      const payload = jwt.verify(String(token).replace(/^Bearer\s+/i, ""), JWT_SECRET);
      if (payload.role !== "ADMIN") {
        throw httpError(403, "Admin token is required");
      }

      return {
        roomCode,
        userId: payload.sub || payload.id,
        role: "ADMIN"
      };
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw httpError(401, "Invalid socket token");
    }
  }

  throw httpError(401, "Socket authentication is required");
}

export function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      credentials: true
    }
  });

  ioInstance.use(async (socket, next) => {
    try {
      socket.data.auth = await authenticateSocket(socket);
      next();
    } catch (error) {
      next(error);
    }
  });

  ioInstance.on("connection", async (socket) => {
    const { roomCode, participantId, role } = socket.data.auth;
    socket.join(roomCode);

    if (participantId) {
      const sockets = participantSockets.get(participantId) || new Set();
      const wasOffline = sockets.size === 0;
      sockets.add(socket.id);
      participantSockets.set(participantId, sockets);

      if (wasOffline) {
        await setParticipantConnected(participantId, true);
      }
    }

    await emitRoomState(roomCode);
    await emitParticipantsUpdated(roomCode);

    socket.on("disconnect", async () => {
      if (participantId) {
        const sockets = participantSockets.get(participantId);
        sockets?.delete(socket.id);

        if (!sockets || sockets.size === 0) {
          participantSockets.delete(participantId);
          await setParticipantConnected(participantId, false);
        }

        await emitParticipantsUpdated(roomCode);
      }
    });

    socket.emit("ROOM_CONNECTED", {
      roomCode,
      role
    });
  });

  return ioInstance;
}

export async function emitRoomState(code) {
  const room = await requireRoomByCode(code);
  emitToRoom(code, "ROOM_STATE", roomStatePayload(room));
}

export async function emitParticipantsUpdated(code) {
  emitToRoom(code, "PARTICIPANTS_UPDATED", {
    participants: await listParticipants(code)
  });
}

export function emitRoomStarted(room) {
  const payload = roomStatePayload(room);
  emitToRoom(room.code, "ROOM_STARTED", payload);
  emitToRoom(room.code, "ROOM_STATE", payload);
}

export function emitRoomFinished(room) {
  const payload = roomStatePayload(room);
  emitToRoom(room.code, "ROOM_FINISHED", payload);
  emitToRoom(room.code, "ROOM_STATE", payload);
}

export function emitRoomSettingsUpdated(room) {
  const payload = roomStatePayload(room);
  emitToRoom(room.code, "ROOM_SETTINGS_UPDATED", payload);
  emitToRoom(room.code, "ROOM_STATE", payload);
}
