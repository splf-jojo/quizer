import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { getQuizForRoom, getResultForParticipant, submitAnswers } from "../services/answer.service.js";
import {
  getClientIp,
  joinRoom,
  listParticipants,
  updateParticipantName
} from "../services/participant.service.js";
import {
  createRoom,
  finishRoom,
  getRoomByCode,
  listRooms,
  requireRoomByCode,
  roomStatePayload,
  startRoom,
  updateRoomSettings
} from "../services/room.service.js";
import {
  emitParticipantsUpdated,
  emitRoomFinished,
  emitRoomSettingsUpdated,
  emitRoomStarted,
  emitRoomState
} from "../socket/socket.js";
import { serverTime } from "../utils/time.js";

const router = Router();
const joinAttemptsByIp = new Map();
const JOIN_RATE_LIMIT_WINDOW_MS = 60_000;
const JOIN_RATE_LIMIT_MAX = 60;

function enforceJoinRateLimit(ipAddress) {
  if (!ipAddress) {
    return;
  }

  const now = Date.now();
  const current = joinAttemptsByIp.get(ipAddress) || {
    count: 0,
    resetAt: now + JOIN_RATE_LIMIT_WINDOW_MS
  };

  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + JOIN_RATE_LIMIT_WINDOW_MS;
  }

  current.count += 1;
  joinAttemptsByIp.set(ipAddress, current);

  if (current.count > JOIN_RATE_LIMIT_MAX) {
    const error = new Error("Too many join attempts. Please try again later.");
    error.status = 429;
    throw error;
  }
}

router.get(
  "/",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      rooms: await listRooms()
    });
  })
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await createRoom(req.body, req.user.sub || req.user.id);
    res.status(201).json(result);
  })
);

router.get(
  "/:code",
  asyncHandler(async (req, res) => {
    const room = await requireRoomByCode(req.params.code);
    res.json(roomStatePayload(room));
  })
);

router.patch(
  "/:code/settings",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const room = await updateRoomSettings(req.params.code, req.body);
    emitRoomSettingsUpdated(room);
    res.json({
      room
    });
  })
);

router.post(
  "/:code/start",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const room = await startRoom(req.params.code);
    emitRoomStarted(room);
    res.json({
      room
    });
  })
);

router.post(
  "/:code/finish",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const room = await finishRoom(req.params.code);
    emitRoomFinished(room);
    res.json({
      room
    });
  })
);

router.post(
  "/:code/join",
  asyncHandler(async (req, res) => {
    enforceJoinRateLimit(getClientIp(req));
    const result = await joinRoom(req.params.code, req.body);
    res.status(201).json({
      ...result,
      serverTime: serverTime()
    });
  })
);

router.get(
  "/:code/participants",
  asyncHandler(async (req, res) => {
    res.json({
      participants: await listParticipants(req.params.code)
    });
  })
);

router.patch(
  "/:code/participants/:participantId",
  asyncHandler(async (req, res) => {
    const participant = await updateParticipantName(
      req.params.code,
      req.params.participantId,
      req.body.displayName
    );
    await emitParticipantsUpdated(req.params.code);
    res.json({
      participant
    });
  })
);

router.get(
  "/:code/quiz",
  asyncHandler(async (req, res) => {
    const room = await getRoomByCode(req.params.code);
    const quiz = await getQuizForRoom(req.params.code);
    res.json({
      quizId: quiz.id,
      title: quiz.title,
      description: quiz.description,
      status: room?.status,
      endsAt: room?.endsAt,
      allowBackNavigation: room?.allowBackNavigation,
      serverTime: serverTime(),
      questions: quiz.questions
    });
  })
);

router.post(
  "/:code/submit",
  asyncHandler(async (req, res) => {
    const result = await submitAnswers(req.params.code, req.body);
    res.json(result);
  })
);

router.get(
  "/:code/result/:participantId",
  asyncHandler(async (req, res) => {
    const result = await getResultForParticipant(req.params.code, req.params.participantId);
    res.json(result);
  })
);

router.post(
  "/:code/emit-state",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await emitRoomState(req.params.code);
    await emitParticipantsUpdated(req.params.code);
    res.json({ emitted: true });
  })
);

export default router;
