# /UIscreenshot workflow

Use this file when the user sends `/UIscreenshot` or asks for UI screenshots after frontend changes.

## Purpose

Generate real browser screenshots of the Quizzer frontend pages into a fresh timestamped folder.

## Prerequisites

1. Backend is running and reachable from `client/.env` `VITE_API_URL`.
2. Frontend is running and reachable from `client/.env` `VITE_PUBLIC_URL`.
3. Database has seed data:

```bash
cd server
npm run db:setup
npm run dev
```

4. Frontend dev server is running:

```bash
cd client
npm run dev
```

If Playwright Chromium is missing, install it once:

```bash
cd client
npm run ui:screenshot:install
```

## Command

Run:

```bash
cd client
npm run ui:screenshot
```

Optional overrides:

```bash
UI_BASE_URL=http://localhost:5173 UI_API_URL=http://localhost:4000/api npm run ui:screenshot
```

PowerShell overrides:

```powershell
$env:UI_BASE_URL="http://localhost:5173"
$env:UI_API_URL="http://localhost:4000/api"
npm run ui:screenshot
```

## Output

Screenshots are written to:

```text
AGENTS/ui-screenshots/<timestamp>/
```

The script also writes `manifest.json` with the routes and file paths.

Expected screenshots:

```text
01-admin-login.png
02-admin-dashboard.png
03-admin-room-setup.png
04-admin-room-waiting.png
05-student-join.png
06-student-waiting.png
07-admin-room-live.png
08-student-quiz.png
09-student-result.png
10-admin-room-finished.png
```

## Reporting

After running, tell the user the output folder and list the generated files. If the script fails, report the exact failing prerequisite, usually:

- backend not running
- frontend not running
- database not seeded
- Playwright Chromium not installed
