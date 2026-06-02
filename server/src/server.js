import "dotenv/config";
import http from "http";
import app from "./app.js";
import { pool } from "./db/pool.js";
import { finishDueRooms, startDueRooms } from "./services/room.service.js";
import { emitRoomFinished, emitRoomStarted, initSocket } from "./socket/socket.js";

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";
const LIFECYCLE_INTERVAL_MS = Number(process.env.LIFECYCLE_INTERVAL_MS || 2000);

const server = http.createServer(app);
initSocket(server);

let lifecycleRunning = false;
const lifecycleTimer = setInterval(async () => {
  if (lifecycleRunning) {
    return;
  }

  lifecycleRunning = true;

  try {
    const startedRooms = await startDueRooms();
    for (const room of startedRooms) {
      emitRoomStarted(room);
    }

    const finishedRooms = await finishDueRooms();
    for (const room of finishedRooms) {
      emitRoomFinished(room);
    }
  } catch (error) {
    console.error("Room lifecycle check failed:", error);
  } finally {
    lifecycleRunning = false;
  }
}, LIFECYCLE_INTERVAL_MS);

server.listen(PORT, HOST, () => {
  console.log(`Quizzer API listening on http://${HOST}:${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  clearInterval(lifecycleTimer);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
