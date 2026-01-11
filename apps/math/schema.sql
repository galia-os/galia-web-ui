-- Run this SQL in your Vercel Postgres database to create the required table

CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(10) NOT NULL,
  user_name VARCHAR(50) NOT NULL,
  theme_id VARCHAR(100) NOT NULL,
  theme_name VARCHAR(200) NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  total_time_seconds INTEGER NOT NULL,
  avg_time_per_question REAL NOT NULL,
  mistakes JSONB NOT NULL,
  all_answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);

-- Index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results(completed_at);

-- Lessons table for storing AI-generated lessons between rounds
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(200) NOT NULL UNIQUE,
  user_id VARCHAR(10) NOT NULL,
  user_name VARCHAR(50) NOT NULL,
  theme_name VARCHAR(200) NOT NULL,
  grade INTEGER NOT NULL,
  lesson_text TEXT NOT NULL,
  lesson_audio_base64 TEXT,  -- Base64-encoded MP3 audio
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lesson lookups by session
CREATE INDEX IF NOT EXISTS idx_lessons_session_id ON lessons(session_id);
