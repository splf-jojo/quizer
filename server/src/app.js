import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import quizzesRoutes from "./routes/quizzes.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const app = express();

app.set("trust proxy", true);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    serverTime: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizzesRoutes);
app.use("/api/rooms", roomsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
