-- ============================================================
-- TomberS — Setup de tablas en Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  "firstName"     TEXT NOT NULL,
  "lastName"      TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  username        TEXT UNIQUE NOT NULL,
  password        TEXT NOT NULL,
  skills          JSONB DEFAULT '[]',
  age             TEXT DEFAULT '',
  "birthDate"     TEXT DEFAULT '',
  languages       TEXT DEFAULT '',
  specialization  TEXT DEFAULT '',
  phone           TEXT DEFAULT '',
  linkedin        TEXT DEFAULT '',
  github          TEXT DEFAULT '',
  portfolio       TEXT DEFAULT '',
  bio             TEXT DEFAULT '',
  status          TEXT DEFAULT 'Disponible',
  certifications  JSONB DEFAULT '[]',
  interests       JSONB DEFAULT '[]',
  objectives      JSONB DEFAULT '[]',
  photo_url       TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  image_url     TEXT DEFAULT '',
  stats         JSONB DEFAULT '{}',
  technologies  JSONB DEFAULT '[]',
  objectives    JSONB DEFAULT '[]',
  skills_needed JSONB DEFAULT '[]',
  progress      INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'active',
  creator_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    DATE DEFAULT CURRENT_DATE,
  updated_at    DATE DEFAULT CURRENT_DATE
);

-- Campo de declaración anti-trabajo-encubierto en proyectos
ALTER TABLE projects ADD COLUMN IF NOT EXISTS declared BOOLEAN DEFAULT FALSE;

-- Estado de moderación: se actualiza automáticamente cuando un proyecto
-- acumula reportes (ver app.py / create_report). 'active' visible normal,
-- 'flagged' oculto del feed público (visible solo a su creador con aviso),
-- 'under_review'/'hidden' reservados para moderación manual futura.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'active';

-- Tabla de reportes
-- reason acepta: 'trabajo_encubierto' | 'spam' | 'ghosting' | 'abuso'
CREATE TABLE IF NOT EXISTS reports (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  reporter_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason       TEXT NOT NULL DEFAULT 'trabajo_encubierto',
  detail       TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Deshabilitar Row Level Security para desarrollo (MVP)
-- En producción habría que configurar políticas RLS en vez de esto
ALTER TABLE users    DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports  DISABLE ROW LEVEL SECURITY;
