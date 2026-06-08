-- Agregar columna objectives a la tabla users
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
ALTER TABLE users ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]';
