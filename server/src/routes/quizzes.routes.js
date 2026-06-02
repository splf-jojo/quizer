import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { getQuizById, listQuizzes } from "../services/quiz.service.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      quizzes: await listQuizzes()
    });
  })
);

router.get(
  "/:quizId",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      quiz: await getQuizById(req.params.quizId, { includeCorrect: true })
    });
  })
);

export default router;
