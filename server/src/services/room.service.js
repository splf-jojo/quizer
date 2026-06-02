import { query } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";
import { generateRoomCode } from "../utils/generateRoomCode.js";
import { parseOptionalDate, serverTime, toIso } from "../utils/time.js";
import { quizExists } from "./quiz.service.js";

const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

export function mapRoom(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    code: row.code,
    quizId: row.quiz_id,
    quizTitle: row.quiz_title,
    status: row.status,
    showCorrectAnswers: row.show_correct_answers,
    allowBackNavigation: row.allow_back_navigation,
    durationSeconds: row.duration_seconds,
    startsAt: toIso(row.starts_at),
    endsAt: toIso(row.ends_at),
    startedAt: toIso(row.started_at),
    finishedAt: toIso(row.finished_at),
    createdAt: toIso(row.created_at)
  };
}

function roomSelectSql(whereClause) {
  return `SELECT rooms.*, quizzes.title AS quiz_title
          FROM rooms
          JOIN quizzes ON quizzes.id = rooms.quiz_id
          ${whereClause}`;
}

function normalizeSettings(input, currentRoom) {
  const durationValue =
    input.durationSeconds === undefined
      ? currentRoom?.durationSeconds ?? 600
      : Number(input.durationSeconds);

  if (!Number.isInteger(durationValue) || durationValue < 30 || durationValue > 7200) {
    throw httpError(400, "durationSeconds must be an integer between 30 and 7200");
  }

  let startsAt;
  let endsAt;

  try {
    startsAt =
      input.startsAt === undefined
        ? currentRoom?.startsAt
          ? new Date(currentRoom.startsAt)
          : null
        : parseOptionalDate(input.startsAt, "startsAt");
    endsAt =
      input.endsAt === undefined
        ? currentRoom?.endsAt
          ? new Date(currentRoom.endsAt)
          : null
        : parseOptionalDate(input.endsAt, "endsAt");
  } catch (error) {
    throw httpError(400, error.message);
  }

  if (startsAt && endsAt && startsAt >= endsAt) {
    throw httpError(400, "endsAt must be after startsAt");
  }

  return {
    showCorrectAnswers:
      input.showCorrectAnswers === undefined
        ? currentRoom?.showCorrectAnswers ?? false
        : Boolean(input.showCorrectAnswers),
    allowBackNavigation:
      input.allowBackNavigation === undefined
        ? currentRoom?.allowBackNavigation ?? true
        : Boolean(input.allowBackNavigation),
    durationSeconds: durationValue,
    startsAt,
    endsAt
  };
}

export function roomStatePayload(room) {
  return {
    code: room.code,
    status: room.status,
    quizTitle: room.quizTitle,
    showCorrectAnswers: room.showCorrectAnswers,
    allowBackNavigation: room.allowBackNavigation,
    durationSeconds: room.durationSeconds,
    startsAt: room.startsAt,
    endsAt: room.endsAt,
    startedAt: room.startedAt,
    finishedAt: room.finishedAt,
    serverTime: serverTime()
  };
}

export async function getRoomByCode(code) {
  const { rows } = await query(roomSelectSql("WHERE rooms.code = $1"), [code]);
  return mapRoom(rows[0]);
}

export async function requireRoomByCode(code) {
  const room = await getRoomByCode(code);
  if (!room) {
    throw httpError(404, "Room was not found");
  }
  return room;
}

export async function listRooms() {
  const { rows } = await query(
    `SELECT rooms.*,
            quizzes.title AS quiz_title,
            quizzes.description AS quiz_description,
            COALESCE(participant_counts.participant_count, 0) AS participant_count,
            COALESCE(participant_counts.completed_count, 0) AS completed_count
     FROM rooms
     JOIN quizzes ON quizzes.id = rooms.quiz_id
     LEFT JOIN (
       SELECT room_id,
              COUNT(id) AS participant_count,
              COUNT(id) FILTER (WHERE completed = TRUE) AS completed_count
       FROM participants
       GROUP BY room_id
     ) AS participant_counts ON participant_counts.room_id = rooms.id
     ORDER BY rooms.created_at DESC`
  );

  return rows.map((row) => ({
    ...mapRoom(row),
    quizDescription: row.quiz_description,
    participantCount: Number(row.participant_count || 0),
    completedCount: Number(row.completed_count || 0)
  }));
}

export async function createRoom(input, adminUserId) {
  if (!input.quizId) {
    throw httpError(400, "quizId is required");
  }

  if (!(await quizExists(input.quizId))) {
    throw httpError(404, "Quiz was not found");
  }

  const settings = normalizeSettings(input, null);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateRoomCode();

    try {
      const { rows } = await query(
        `INSERT INTO rooms (
           quiz_id,
           code,
           show_correct_answers,
           allow_back_navigation,
           duration_seconds,
           starts_at,
           ends_at,
           created_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          input.quizId,
          code,
          settings.showCorrectAnswers,
          settings.allowBackNavigation,
          settings.durationSeconds,
          settings.startsAt,
          settings.endsAt,
          adminUserId
        ]
      );

      const room = await getRoomByCode(rows[0].code);
      return {
        room: {
          ...room,
          joinUrl: `${CLIENT_URL}/room/${room.code}`
        }
      };
    } catch (error) {
      if (error.code !== "23505") {
        throw error;
      }
    }
  }

  throw httpError(500, "Could not generate a unique room code");
}

export async function updateRoomSettings(code, input) {
  const currentRoom = await requireRoomByCode(code);

  if (currentRoom.status !== "WAITING") {
    throw httpError(409, "Room settings are locked after start");
  }

  const settings = normalizeSettings(input, currentRoom);

  await query(
    `UPDATE rooms
     SET show_correct_answers = $2,
         allow_back_navigation = $3,
         duration_seconds = $4,
         starts_at = $5,
         ends_at = $6
     WHERE code = $1`,
    [
      code,
      settings.showCorrectAnswers,
      settings.allowBackNavigation,
      settings.durationSeconds,
      settings.startsAt,
      settings.endsAt
    ]
  );

  return requireRoomByCode(code);
}

export async function startRoom(code) {
  const { rows } = await query(
    `UPDATE rooms
     SET status = 'STARTED',
         started_at = COALESCE(started_at, NOW()),
         ends_at = COALESCE(ends_at, NOW() + duration_seconds * INTERVAL '1 second')
     WHERE code = $1 AND status = 'WAITING'
     RETURNING code`,
    [code]
  );

  if (rows[0]) {
    return requireRoomByCode(code);
  }

  const room = await requireRoomByCode(code);

  if (room.status === "STARTED") {
    return room;
  }

  throw httpError(409, "Room cannot be started");
}

export async function finishRoom(code) {
  const { rows } = await query(
    `UPDATE rooms
     SET status = 'FINISHED',
         finished_at = COALESCE(finished_at, NOW())
     WHERE code = $1 AND status IN ('WAITING', 'STARTED')
     RETURNING code`,
    [code]
  );

  if (rows[0]) {
    return requireRoomByCode(code);
  }

  const room = await requireRoomByCode(code);
  if (room.status === "FINISHED") {
    return room;
  }

  throw httpError(409, "Room cannot be finished");
}

export async function startDueRooms() {
  const { rows } = await query(
    `SELECT code
     FROM rooms
     WHERE status = 'WAITING'
       AND starts_at IS NOT NULL
       AND starts_at <= NOW()
     ORDER BY starts_at ASC`
  );

  const startedRooms = [];
  for (const row of rows) {
    try {
      startedRooms.push(await startRoom(row.code));
    } catch (error) {
      console.error(`Could not start scheduled room ${row.code}:`, error.message);
    }
  }

  return startedRooms;
}

export async function finishDueRooms() {
  const { rows } = await query(
    `SELECT code
     FROM rooms
     WHERE status = 'STARTED'
       AND ends_at IS NOT NULL
       AND ends_at <= NOW()
     ORDER BY ends_at ASC`
  );

  const finishedRooms = [];
  for (const row of rows) {
    try {
      finishedRooms.push(await finishRoom(row.code));
    } catch (error) {
      console.error(`Could not finish room ${row.code}:`, error.message);
    }
  }

  return finishedRooms;
}
