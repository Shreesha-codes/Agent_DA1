-- =============================================================================
-- Conversational Data Analysis Agent — Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- =============================================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL,
  display_name    TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- 2. Data Sources table
CREATE TABLE IF NOT EXISTS data_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  source_type      TEXT NOT NULL CHECK (source_type IN ('file', 'postgres')),
  file_format      TEXT CHECK (file_format IN ('csv', 'excel', 'json')),
  storage_path     TEXT,
  file_size_bytes  BIGINT,
  row_count        INTEGER,
  pg_host          TEXT,
  pg_port          INTEGER DEFAULT 5432,
  pg_database      TEXT,
  pg_username      TEXT,
  pg_password_enc  TEXT,
  pg_schema        TEXT DEFAULT 'public',
  pg_table         TEXT,
  column_schema    JSONB,
  data_profile     JSONB,
  profile_status   TEXT DEFAULT 'pending' CHECK (profile_status IN ('pending', 'running', 'complete', 'failed')),
  profile_error    TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_data_sources_user_id ON data_sources(user_id);

-- 3. Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_source_id  UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  title           TEXT,
  message_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_data_source_id ON sessions(data_source_id);

-- 4. Execution Logs table (created before messages since messages reference it)
CREATE TABLE IF NOT EXISTS execution_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  attempt_number  INTEGER NOT NULL DEFAULT 1,
  generated_code  TEXT NOT NULL,
  stdout          TEXT,
  stderr          TEXT,
  exit_code       INTEGER NOT NULL DEFAULT 1,
  execution_ms    INTEGER,
  status          TEXT NOT NULL CHECK (status IN ('success', 'failed', 'timeout')),
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_execution_logs_session_id ON execution_logs(session_id);

-- 5. Visualizations table
CREATE TABLE IF NOT EXISTS visualizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chart_type      TEXT NOT NULL,
  title           TEXT NOT NULL,
  caption         TEXT NOT NULL,
  plotly_json     JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visualizations_session_id ON visualizations(session_id);

-- 6. Messages table
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  execution_log_id UUID REFERENCES execution_logs(id),
  visualization_id UUID REFERENCES visualizations(id),
  turn_index       INTEGER NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_turn ON messages(session_id, turn_index);

-- 7. RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualizations ENABLE ROW LEVEL SECURITY;

-- RLS policies (safety net — backend uses service_role which bypasses RLS)
CREATE POLICY "Users can access own data" ON data_sources FOR ALL
  USING (user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text));
CREATE POLICY "Users can access own sessions" ON sessions FOR ALL
  USING (user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text));
CREATE POLICY "Users can access own messages" ON messages FOR ALL
  USING (user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text));
CREATE POLICY "Users can access own logs" ON execution_logs FOR ALL
  USING (user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text));
CREATE POLICY "Users can access own vizs" ON visualizations FOR ALL
  USING (user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text));

-- 8. Helper function for incrementing message count
CREATE OR REPLACE FUNCTION increment_message_count(sid UUID)
RETURNS void AS $$
BEGIN
  UPDATE sessions SET message_count = message_count + 1, updated_at = now() WHERE id = sid;
END;
$$ LANGUAGE plpgsql;
