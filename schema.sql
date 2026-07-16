/**
 * schema.sql — Cognitive Chronicle Database Schema
 * Compatible with PostgreSQL 14+
 *
 * To initialize: psql -d your_database -f schema.sql
 */

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT        NOT NULL UNIQUE,
  password_hash         TEXT,                           -- NULL for OAuth-only users
  role                  TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  email_verified        BOOLEAN     NOT NULL DEFAULT FALSE,
  otp_code              TEXT,
  otp_expires_at        TIMESTAMPTZ,
  reset_token           TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  google_id             TEXT        UNIQUE,
  created_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users (reset_token);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  slug         TEXT        NOT NULL UNIQUE,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories (sort_order);

-- Default categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Politique',     'politique',     1),
  ('Économie',      'economie',      2),
  ('Technologie',   'technologie',   3),
  ('Science',       'science',       4),
  ('Culture',       'culture',       5),
  ('Sport',         'sport',         6),
  ('Monde',         'monde',         7),
  ('Environnement', 'environnement', 8)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ARTICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT        NOT NULL,
  subtitle             TEXT,
  content              TEXT        NOT NULL,
  summary              TEXT,
  category             TEXT        NOT NULL,
  tags                 JSONB       NOT NULL DEFAULT '[]',
  image_url            TEXT,
  status               TEXT        NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'publie', 'archive')),
  priority             TEXT        NOT NULL DEFAULT 'normale' CHECK (priority IN ('breaking', 'haute', 'normale', 'basse')),
  ai_confidence_score  FLOAT,
  ai_sentiment         TEXT        CHECK (ai_sentiment IN ('positif', 'negatif', 'neutre')),
  ai_perspectives      JSONB,      -- { neutral: string, left: string, right: string }
  ai_fact_checks       JSONB,      -- [{ claim, verdict, confidence }]
  views_count          INTEGER     NOT NULL DEFAULT 0,
  reading_time_min     INTEGER,
  created_date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);
CREATE INDEX IF NOT EXISTS idx_articles_priority ON articles (priority);
CREATE INDEX IF NOT EXISTS idx_articles_created_date ON articles (created_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_status_created ON articles (status, created_date DESC);

-- ============================================================
-- ARTICLE COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS article_comments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id   UUID        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_name  TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  ai_sentiment TEXT        CHECK (ai_sentiment IN ('positif', 'negatif', 'neutre')),
  is_flagged   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_article_id ON article_comments (article_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_date ON article_comments (created_date DESC);

-- ============================================================
-- TRIGGER: auto-update updated_date
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_articles_updated_date ON articles;
CREATE TRIGGER trigger_articles_updated_date
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS trigger_users_updated_date ON users;
CREATE TRIGGER trigger_users_updated_date
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();
