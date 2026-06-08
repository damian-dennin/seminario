-- ============================================================
-- TomberS — Tablas para el sistema de matching y chat
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Intereses: usuario le da like a un proyecto
CREATE TABLE IF NOT EXISTS interests (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'pending', -- 'pending' | 'matched' | 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)        -- un usuario no puede dar like dos veces al mismo proyecto
);

-- Matches: dueño acepta al candidato → se genera el match
CREATE TABLE IF NOT EXISTS matches (
  id          SERIAL PRIMARY KEY,
  interest_id INTEGER REFERENCES interests(id),
  user_id     INTEGER REFERENCES users(id),    -- candidato
  owner_id    INTEGER REFERENCES users(id),    -- dueño del proyecto
  project_id  INTEGER REFERENCES projects(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes del chat
CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  match_id   INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  sender_id  INTEGER REFERENCES users(id),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deshabilitar RLS para dev
ALTER TABLE interests DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches   DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages  DISABLE ROW LEVEL SECURITY;
