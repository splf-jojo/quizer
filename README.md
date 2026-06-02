# Quizzer MVP

Web MVP for live quiz rooms with React, Tailwind CSS, Node.js, Express,
Socket.IO, and PostgreSQL.

## Features

- Admin sign-in with seeded admin credentials.
- Admin sidebar with:
  - `Create Test` - placeholder page for future quiz creation.
  - `Tests` - seeded quiz templates used to create quiz rooms.
  - `All Tests` - all created quiz rooms with search and status filters.
- Quiz room setup with completion settings, schedule, duration, and room summary.
- Live host room with join link, participant list, room start, and finish controls.
- Student join, waiting room, quiz, answer submission, and result screens.
- Scheduled rooms start and finish automatically from the backend lifecycle worker.

## Local Setup

### 1. Start PostgreSQL

The repo includes a PostgreSQL-only Docker Compose file:

```bash
docker compose up -d
```

Default database settings:

```text
Database: quizzer
User: postgres
Password: 123
Port: 5432
```

You can also use a local PostgreSQL instance. The backend setup script creates
the `quizzer` database if it does not exist.

### 2. Install and Seed the Backend

```bash
cd server
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Default backend URL:

```text
http://localhost:4000
```

### 3. Start the Frontend

```bash
cd client
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

## Admin Login

Seeded credentials:

```text
Email:    admin@example.com
Password: admin123
```

## Environment

Backend variables are defined in `server/.env.example`:

```text
PORT=4000
HOST=0.0.0.0
DATABASE_URL=postgres://postgres:123@localhost:5432/quizzer
JWT_SECRET=dev_secret_change_later
CLIENT_URL=http://localhost:5173
LIFECYCLE_INTERVAL_MS=2000
```

Frontend variables are optional:

```text
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_PUBLIC_URL=http://localhost:5173
```

## Main Routes

Admin:

```text
/admin                       Quiz template list
/admin/create                Create Test placeholder
/admin/all-tests             Created quiz rooms with search and filters
/admin/rooms/new/:quizId     Room setup
/admin/rooms/:code           Host room
```

Student:

```text
/room/:code                  Join room
/room/:code/waiting          Waiting room
/room/:code/quiz             Quiz
/room/:code/result           Result
```

## API Overview

Admin endpoints require an admin bearer token:

```text
POST /api/auth/login
GET  /api/quizzes
GET  /api/quizzes/:quizId
GET  /api/rooms
POST /api/rooms
PATCH /api/rooms/:code/settings
POST /api/rooms/:code/start
POST /api/rooms/:code/finish
```

Public room endpoints:

```text
GET  /api/rooms/:code
POST /api/rooms/:code/join
GET  /api/rooms/:code/participants
PATCH /api/rooms/:code/participants/:participantId
GET  /api/rooms/:code/quiz
POST /api/rooms/:code/submit
GET  /api/rooms/:code/result/:participantId
```

## Useful Commands

Backend:

```bash
cd server
npm run dev
npm run start
npm run db:setup
npm run db:init
npm run db:seed
```

Frontend:

```bash
cd client
npm run dev
npm run build
npm run preview
npm run ui:screenshot:install
npm run ui:screenshot
```
