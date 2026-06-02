CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STUDENT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('single_choice')),
  position INT NOT NULL
);

CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  position INT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id),
  code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'WAITING'
    CHECK (status IN ('WAITING', 'STARTED', 'FINISHED', 'CANCELLED')),
  show_correct_answers BOOLEAN NOT NULL DEFAULT FALSE,
  allow_back_navigation BOOLEAN NOT NULL DEFAULT TRUE,
  duration_seconds INT NOT NULL DEFAULT 600,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  display_name VARCHAR(120) NOT NULL,
  role_in_room VARCHAR(20) NOT NULL DEFAULT 'STUDENT'
    CHECK (role_in_room IN ('ADMIN', 'STUDENT')),
  connected BOOLEAN NOT NULL DEFAULT FALSE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id UUID NOT NULL REFERENCES question_options(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (participant_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_position ON questions(quiz_id, position);
CREATE INDEX IF NOT EXISTS idx_options_question_position ON question_options(question_id, position);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_participants_room ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_answers_participant ON answers(participant_id);

ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS allow_back_navigation BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE participants
ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE participants
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

UPDATE participants
SET completed = TRUE,
    submitted_at = COALESCE(participants.submitted_at, submitted_answers.first_submitted_at)
FROM (
  SELECT participant_id, MIN(submitted_at) AS first_submitted_at
  FROM answers
  GROUP BY participant_id
) AS submitted_answers
WHERE participants.id = submitted_answers.participant_id;

DROP INDEX IF EXISTS idx_participants_room_ip_student;

ALTER TABLE participants
DROP COLUMN IF EXISTS ip_address;
