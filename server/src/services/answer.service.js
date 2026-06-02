import { pool } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";
import { getQuizById } from "./quiz.service.js";
import { requireRoomByCode } from "./room.service.js";
import { setParticipantSubmitted } from "./participant.service.js";

export async function getQuizForRoom(code) {
  const room = await requireRoomByCode(code);

  if (room.status !== "STARTED") {
    throw httpError(403, "Quiz is available only after the room starts");
  }

  return getQuizById(room.quizId, { includeCorrect: false });
}

export async function getResultForParticipant(code, participantId) {
  const client = await pool.connect();

  try {
    const roomResult = await client.query(
      `SELECT rooms.*, quizzes.title AS quiz_title
       FROM rooms
       JOIN quizzes ON quizzes.id = rooms.quiz_id
       WHERE rooms.code = $1`,
      [code]
    );
    const room = roomResult.rows[0];

    if (!room) {
      throw httpError(404, "Room was not found");
    }

    const participantResult = await client.query(
      `SELECT id
       FROM participants
       WHERE id = $1 AND room_id = $2`,
      [participantId, room.id]
    );

    if (!participantResult.rows[0]) {
      throw httpError(403, "Participant does not belong to this room");
    }

    const answerCountResult = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM answers
       WHERE room_id = $1 AND participant_id = $2`,
      [room.id, participantId]
    );

    if (answerCountResult.rows[0].count === 0) {
      throw httpError(404, "No submitted answers were found");
    }

    if (!room.show_correct_answers) {
      return {
        submitted: true,
        showCorrectAnswers: false,
        message: "Your answers have been submitted."
      };
    }

    const totalResult = await client.query(
      `SELECT COUNT(*)::int AS total
       FROM questions
       WHERE quiz_id = $1`,
      [room.quiz_id]
    );

    const detailsResult = await client.query(
      `SELECT q.text AS question_text,
              selected_option.text AS selected_option_text,
              correct_option.text AS correct_option_text,
              COALESCE(a.is_correct, FALSE) AS is_correct
       FROM questions q
       LEFT JOIN answers a
         ON a.question_id = q.id
        AND a.room_id = $2
        AND a.participant_id = $3
       LEFT JOIN question_options selected_option
         ON selected_option.id = a.selected_option_id
       LEFT JOIN question_options correct_option
         ON correct_option.question_id = q.id
        AND correct_option.is_correct = TRUE
       WHERE q.quiz_id = $1
       ORDER BY q.position ASC`,
      [room.quiz_id, room.id, participantId]
    );

    const total = totalResult.rows[0].total;
    const score = detailsResult.rows.filter((row) => row.is_correct).length;

    return {
      submitted: true,
      showCorrectAnswers: true,
      score,
      total,
      percentage: total > 0 ? Number(((score / total) * 100).toFixed(2)) : 0,
      details: detailsResult.rows.map((row) => ({
        questionText: row.question_text,
        selectedOptionText: row.selected_option_text,
        correctOptionText: row.correct_option_text,
        isCorrect: row.is_correct
      }))
    };
  } finally {
    client.release();
  }
}

export async function submitAnswers(code, input) {
  const participantId = input.participantId;
  const answers = Array.isArray(input.answers) ? input.answers : [];

  if (!participantId) {
    throw httpError(400, "participantId is required");
  }

  if (answers.length === 0) {
    throw httpError(400, "answers are required");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const roomResult = await client.query(
      `SELECT rooms.*
       FROM rooms
       WHERE rooms.code = $1
       FOR UPDATE`,
      [code]
    );
    const room = roomResult.rows[0];

    if (!room) {
      throw httpError(404, "Room was not found");
    }

    if (room.status !== "STARTED") {
      throw httpError(409, "Room is not started");
    }

    if (room.ends_at && new Date() > new Date(room.ends_at)) {
      throw httpError(409, "Submission time has ended");
    }

    const participantResult = await client.query(
      `SELECT id, completed, submitted_at
       FROM participants
       WHERE id = $1 AND room_id = $2
       FOR UPDATE`,
      [participantId, room.id]
    );

    const participant = participantResult.rows[0];
    if (!participant) {
      throw httpError(403, "Participant does not belong to this room");
    }

    if (participant.completed || participant.submitted_at) {
      throw httpError(409, "Answers were already submitted");
    }

    const existingResult = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM answers
       WHERE room_id = $1 AND participant_id = $2`,
      [room.id, participantId]
    );

    if (existingResult.rows[0].count > 0) {
      await setParticipantSubmitted(client, participantId, room.id);
      throw httpError(409, "Answers were already submitted");
    }

    const quizQuestionResult = await client.query(
      `SELECT id
       FROM questions
       WHERE quiz_id = $1
       ORDER BY position ASC`,
      [room.quiz_id]
    );

    const requiredQuestionIds = new Set(quizQuestionResult.rows.map((row) => row.id));
    const submittedQuestionIds = new Set(answers.map((answer) => answer.questionId));

    if (
      requiredQuestionIds.size !== submittedQuestionIds.size ||
      [...requiredQuestionIds].some((id) => !submittedQuestionIds.has(id))
    ) {
      throw httpError(400, "One answer is required for each quiz question");
    }

    for (const answer of answers) {
      if (!answer.questionId || !answer.selectedOptionId) {
        throw httpError(400, "Each answer requires questionId and selectedOptionId");
      }

      if (!requiredQuestionIds.has(answer.questionId)) {
        throw httpError(400, "Question does not belong to this room quiz");
      }

      const optionResult = await client.query(
        `SELECT id, is_correct
         FROM question_options
         WHERE id = $1 AND question_id = $2`,
        [answer.selectedOptionId, answer.questionId]
      );

      const option = optionResult.rows[0];
      if (!option) {
        throw httpError(400, "Selected option does not belong to the question");
      }

      await client.query(
        `INSERT INTO answers (
           room_id,
           participant_id,
           question_id,
           selected_option_id,
           is_correct
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [room.id, participantId, answer.questionId, answer.selectedOptionId, option.is_correct]
      );
    }

    await setParticipantSubmitted(client, participantId, room.id);

    await client.query("COMMIT");
    return getResultForParticipant(code, participantId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
