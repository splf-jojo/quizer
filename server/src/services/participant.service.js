import { query } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";
import { toIso } from "../utils/time.js";
import { requireRoomByCode } from "./room.service.js";

function mapParticipant(row) {
  return {
    id: row.id,
    displayName: row.display_name,
    roleInRoom: row.role_in_room,
    connected: row.connected,
    completed: row.completed,
    submittedAt: toIso(row.submitted_at),
    joinedAt: toIso(row.joined_at),
    lastSeenAt: toIso(row.last_seen_at)
  };
}

export function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const rawIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0] || req.ip || req.socket.remoteAddress || null;

  if (!rawIp) {
    return null;
  }

  return rawIp.trim().replace(/^::ffff:/, "");
}

function validateDisplayName(value) {
  const displayName = String(value || "").trim();
  if (displayName.length < 2 || displayName.length > 120) {
    throw httpError(400, "displayName must be between 2 and 120 characters");
  }

  return displayName;
}

export async function joinRoom(code, input) {
  const room = await requireRoomByCode(code);

  if (input.participantId) {
    const existingResult = await query(
      `UPDATE participants
       SET last_seen_at = NOW()
       WHERE id = $1
         AND room_id = $2
         AND role_in_room = 'STUDENT'
       RETURNING id,
                 display_name,
                 role_in_room,
                 connected,
                 completed,
                 submitted_at,
                 joined_at,
                 last_seen_at
       `,
      [input.participantId, room.id]
    );

    if (existingResult.rows[0]) {
      return {
        participant: mapParticipant(existingResult.rows[0]),
        room: {
          code: room.code,
          status: room.status
        }
      };
    }
  }

  if (room.status === "FINISHED" || room.status === "CANCELLED") {
    throw httpError(409, "Room is already closed");
  }

  const displayName = validateDisplayName(input.displayName);
  const { rows } = await query(
    `INSERT INTO participants (room_id, display_name, role_in_room)
     VALUES ($1, $2, 'STUDENT')
     RETURNING *`,
    [room.id, displayName]
  );

  return {
    participant: mapParticipant(rows[0]),
    room: {
      code: room.code,
      status: room.status
    }
  };
}

export async function listParticipants(code) {
  const room = await requireRoomByCode(code);
  const { rows } = await query(
    `SELECT id,
            display_name,
            role_in_room,
            connected,
            completed,
            submitted_at,
            joined_at,
            last_seen_at
     FROM participants
     WHERE room_id = $1 AND role_in_room = 'STUDENT'
     ORDER BY joined_at ASC`,
    [room.id]
  );

  return rows.map(mapParticipant);
}

export async function updateParticipantName(code, participantId, displayNameInput) {
  const displayName = validateDisplayName(displayNameInput);
  const room = await requireRoomByCode(code);

  if (room.status !== "WAITING") {
    throw httpError(409, "Display name can be changed only while waiting");
  }

  const { rows } = await query(
    `UPDATE participants
     SET display_name = $3,
         last_seen_at = NOW()
     WHERE id = $1
       AND room_id = $2
       AND role_in_room = 'STUDENT'
     RETURNING *`,
    [participantId, room.id, displayName]
  );

  if (!rows[0]) {
    throw httpError(404, "Participant was not found");
  }

  return mapParticipant(rows[0]);
}

export async function validateParticipantForRoom(participantId, code) {
  const { rows } = await query(
    `SELECT participants.*, rooms.code
     FROM participants
     JOIN rooms ON rooms.id = participants.room_id
     WHERE participants.id = $1 AND rooms.code = $2`,
    [participantId, code]
  );

  if (!rows[0]) {
    throw httpError(403, "Participant does not belong to this room");
  }

  return mapParticipant(rows[0]);
}

export async function setParticipantConnected(participantId, connected) {
  const { rows } = await query(
    `UPDATE participants
     SET connected = $2,
         last_seen_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [participantId, connected]
  );

  return rows[0] ? mapParticipant(rows[0]) : null;
}

export async function setParticipantSubmitted(client, participantId, roomId) {
  const { rows } = await client.query(
    `UPDATE participants
     SET completed = TRUE,
         submitted_at = COALESCE(submitted_at, NOW()),
         last_seen_at = NOW()
     WHERE id = $1 AND room_id = $2
     RETURNING *`,
    [participantId, roomId]
  );

  return rows[0] ? mapParticipant(rows[0]) : null;
}
