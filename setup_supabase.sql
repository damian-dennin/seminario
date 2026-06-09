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

-- Deshabilitar Row Level Security para desarrollo (MVP)
-- En producción habría que configurar políticas RLS en vez de esto
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
