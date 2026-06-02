import { Router } from "express";
import { asyncHandler } from "../middleware/error.middleware.js";
import { loginAdmin } from "../services/auth.service.js";

const router = Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const result = await loginAdmin(req.body.email, req.body.password);
    res.json(result);
  })
);

export default router;
