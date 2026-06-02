# Quizzer MVP

Web MVP for live quiz rooms with React, Tailwind CSS, Node.js, Express, Socket.IO, and PostgreSQL.

## Local setup

1. Start PostgreSQL and create the `quizzer` database.

```bash
createdb -h localhost -p 5432 -U postgres quizzer
```

2. Install and seed the backend.

```bash
cd server
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

3. Start the frontend.

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Admin login:

```text
admin@example.com
admin123
```

Default local URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:4000
```
