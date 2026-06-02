import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const clientDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = dirname(clientDir);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

async function readClientEnv() {
  try {
    return parseEnv(await readFile(join(clientDir, ".env"), "utf8"));
  } catch {
    return {};
  }
}

function withoutTrailingSlash(value) {
  return value.replace(/\/$/, "");
}

function deriveApiUrl(baseUrl) {
  const url = new URL(baseUrl);
  url.port = "4000";
  url.pathname = "/api";
  return withoutTrailingSlash(url.toString());
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function buildReachabilityError(label, url, error, helpLines = []) {
  const reason = error.name === "AbortError" ? "request timed out" : error.message;
  return new Error(
    [
      `Cannot reach ${label}: ${url}`,
      `Reason: ${reason}`,
      "",
      ...helpLines
    ].join("\n")
  );
}

async function assertReachable(url, label, helpLines = []) {
  try {
    const response = await fetchWithTimeout(url);
    if (response.status >= 500) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    throw buildReachabilityError(label, url, error, helpLines);
  }
}

async function apiRequest(apiUrl, path, { token, method = "GET", body } = {}) {
  let response;
  try {
    response = await fetchWithTimeout(`${apiUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    throw buildReachabilityError("backend API", `${apiUrl}${path}`, error, [
      "Start the backend in another terminal:",
      "  cd server",
      "  npm run dev",
      "",
      "PowerShell override example:",
      '  $env:UI_API_URL="http://localhost:4000/api"',
      "  npm run ui:screenshot"
    ]);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${payload.error?.message || response.statusText}`);
  }

  return payload;
}

async function createRoom(apiUrl, token, quizId, overrides = {}) {
  const result = await apiRequest(apiUrl, "/rooms", {
    method: "POST",
    token,
    body: {
      quizId,
      showCorrectAnswers: true,
      allowBackNavigation: true,
      durationSeconds: 600,
      startsAt: null,
      endsAt: null,
      ...overrides
    }
  });

  return result.room;
}

async function createAdminContext(browser, baseUrl, auth) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(
    ({ authValue }) => {
      localStorage.setItem("quizzer_admin_auth", JSON.stringify(authValue));
    },
    { authValue: auth }
  );
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  return { context, page };
}

async function createStudentContext(browser, baseUrl, code, participant) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(
    ({ roomCode, participantValue }) => {
      localStorage.setItem(`quizzer:${roomCode}:participantId`, participantValue.id);
      localStorage.setItem(`quizzer:${roomCode}:participant`, JSON.stringify(participantValue));
    },
    { roomCode: code, participantValue: participant }
  );
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  return { context, page };
}

async function screenshot(page, baseUrl, outputDir, route, name) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  const filePath = join(outputDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`${name}: ${filePath}`);
  return { name, route, filePath };
}

async function main() {
  const env = await readClientEnv();
  const baseUrl = withoutTrailingSlash(
    process.env.UI_BASE_URL || env.VITE_PUBLIC_URL || "http://localhost:5173"
  );
  const apiUrl = withoutTrailingSlash(
    process.env.UI_API_URL || env.VITE_API_URL || deriveApiUrl(baseUrl)
  );
  const outputDir = resolve(
    process.env.UI_SCREENSHOT_DIR || join(repoRoot, "AGENTS", "ui-screenshots", timestamp)
  );

  await assertReachable(`${baseUrl}/admin`, "frontend", [
    "Start the frontend in another terminal:",
    "  cd client",
    "  npm run dev",
    "",
    "Current screenshot URL comes from UI_BASE_URL or client/.env VITE_PUBLIC_URL.",
    "PowerShell override example:",
    '  $env:UI_BASE_URL="http://localhost:5173"',
    "  npm run ui:screenshot"
  ]);

  const health = await apiRequest(apiUrl, "/health");
  if (!health.ok) {
    throw new Error(`Backend health check failed at ${apiUrl}/health`);
  }

  const auth = await apiRequest(apiUrl, "/auth/login", {
    method: "POST",
    body: {
      email: process.env.UI_ADMIN_EMAIL || "admin@example.com",
      password: process.env.UI_ADMIN_PASSWORD || "admin123"
    }
  });

  const quizzesResult = await apiRequest(apiUrl, "/quizzes", { token: auth.token });
  const quiz = quizzesResult.quizzes[0];
  if (!quiz) {
    throw new Error("No seed quiz found. Run server npm run db:setup first.");
  }

  const waitingRoom = await createRoom(apiUrl, auth.token, quiz.id);
  const participantResult = await apiRequest(apiUrl, `/rooms/${waitingRoom.code}/join`, {
    method: "POST",
    body: { displayName: "Screenshot Student" }
  });
  const participant = participantResult.participant;

  await mkdir(outputDir, { recursive: true });

  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    console.error(
      "Playwright Chromium is not installed. Run: cd client && npm run ui:screenshot:install"
    );
    throw error;
  }

  const captures = [];
  try {
    const loginContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const loginPage = await loginContext.newPage();
    captures.push(await screenshot(loginPage, baseUrl, outputDir, "/admin", "01-admin-login"));
    await loginContext.close();

    const { context: adminContext, page: adminPage } = await createAdminContext(browser, baseUrl, {
      token: auth.token,
      user: auth.user
    });
    captures.push(await screenshot(adminPage, baseUrl, outputDir, "/admin", "02-admin-dashboard"));
    captures.push(
      await screenshot(
        adminPage,
        baseUrl,
        outputDir,
        `/admin/rooms/new/${quiz.id}`,
        "03-admin-room-setup"
      )
    );
    captures.push(
      await screenshot(
        adminPage,
        baseUrl,
        outputDir,
        `/admin/rooms/${waitingRoom.code}`,
        "04-admin-room-waiting"
      )
    );

    const joinContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const joinPage = await joinContext.newPage();
    captures.push(
      await screenshot(
        joinPage,
        baseUrl,
        outputDir,
        `/room/${waitingRoom.code}`,
        "05-student-join"
      )
    );
    await joinContext.close();

    const { context: studentContext, page: studentPage } = await createStudentContext(
      browser,
      baseUrl,
      waitingRoom.code,
      participant
    );
    captures.push(
      await screenshot(
        studentPage,
        baseUrl,
        outputDir,
        `/room/${waitingRoom.code}/waiting`,
        "06-student-waiting"
      )
    );

    await apiRequest(apiUrl, `/rooms/${waitingRoom.code}/start`, {
      method: "POST",
      token: auth.token
    });
    captures.push(
      await screenshot(
        adminPage,
        baseUrl,
        outputDir,
        `/admin/rooms/${waitingRoom.code}`,
        "07-admin-room-live"
      )
    );
    captures.push(
      await screenshot(
        studentPage,
        baseUrl,
        outputDir,
        `/room/${waitingRoom.code}/quiz`,
        "08-student-quiz"
      )
    );

    const roomQuiz = await apiRequest(apiUrl, `/rooms/${waitingRoom.code}/quiz`);
    await apiRequest(apiUrl, `/rooms/${waitingRoom.code}/submit`, {
      method: "POST",
      body: {
        participantId: participant.id,
        answers: roomQuiz.questions.map((question) => ({
          questionId: question.id,
          selectedOptionId: question.options[0].id
        }))
      }
    });
    captures.push(
      await screenshot(
        studentPage,
        baseUrl,
        outputDir,
        `/room/${waitingRoom.code}/result`,
        "09-student-result"
      )
    );

    await apiRequest(apiUrl, `/rooms/${waitingRoom.code}/finish`, {
      method: "POST",
      token: auth.token
    });
    captures.push(
      await screenshot(
        adminPage,
        baseUrl,
        outputDir,
        `/admin/rooms/${waitingRoom.code}`,
        "10-admin-room-finished"
      )
    );

    await studentContext.close();
    await adminContext.close();
  } finally {
    await browser.close();
  }

  await writeFile(
    join(outputDir, "manifest.json"),
    JSON.stringify({ baseUrl, apiUrl, createdAt: new Date().toISOString(), captures }, null, 2)
  );

  console.log(`Screenshots written to: ${outputDir}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
