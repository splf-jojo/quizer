import { query } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";
import { toIso } from "../utils/time.js";

function mapQuiz(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    questionCount: Number(row.question_count || 0),
    createdAt: toIso(row.created_at)
  };
}

function mapQuestion(row, options) {
  return {
    id: row.id,
    text: row.text,
    type: row.type,
    position: row.position,
    options
  };
}

export async function listQuizzes() {
  const { rows } = await query(
    `SELECT q.id, q.title, q.description, q.created_at, COUNT(questions.id) AS question_count
     FROM quizzes q
     LEFT JOIN questions ON questions.quiz_id = q.id
     GROUP BY q.id
     ORDER BY q.created_at ASC, q.title ASC`
  );

  return rows.map(mapQuiz);
}

export async function getQuizById(quizId, { includeCorrect = false } = {}) {
  const quizResult = await query(
    `SELECT id, title, description, created_at
     FROM quizzes
     WHERE id = $1`,
    [quizId]
  );

  const quiz = quizResult.rows[0];
  if (!quiz) {
    throw httpError(404, "Quiz was not found");
  }

  const questionResult = await query(
    `SELECT id, text, type, position
     FROM questions
     WHERE quiz_id = $1
     ORDER BY position ASC`,
    [quizId]
  );

  const questionIds = questionResult.rows.map((question) => question.id);
  let optionRows = [];

  if (questionIds.length > 0) {
    const optionSelect = includeCorrect
      ? "id, question_id, text, is_correct, position"
      : "id, question_id, text, position";

    const optionResult = await query(
      `SELECT ${optionSelect}
       FROM question_options
       WHERE question_id = ANY($1::uuid[])
       ORDER BY position ASC`,
      [questionIds]
    );

    optionRows = optionResult.rows;
  }

  const optionsByQuestion = new Map();
  for (const option of optionRows) {
    const mapped = {
      id: option.id,
      text: option.text,
      position: option.position
    };

    if (includeCorrect) {
      mapped.isCorrect = option.is_correct;
    }

    const list = optionsByQuestion.get(option.question_id) || [];
    list.push(mapped);
    optionsByQuestion.set(option.question_id, list);
  }

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    createdAt: toIso(quiz.created_at),
    questions: questionResult.rows.map((question) =>
      mapQuestion(question, optionsByQuestion.get(question.id) || [])
    )
  };
}

export async function quizExists(quizId) {
  const { rows } = await query("SELECT id FROM quizzes WHERE id = $1", [quizId]);
  return Boolean(rows[0]);
}
