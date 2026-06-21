-- Initial schema for the blogging API
-- Run this in the Supabase SQL Editor or via `supabase db push`

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- Categories lookup (seeded from app config; extend via migration or seed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  slug        TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  description TEXT,
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO categories (slug, label, description, sort_order) VALUES
  ('tech',            'Tech',             'Technology, programming, and engineering', 1),
  ('projects',        'Projects',         'Personal and side projects',             2),
  ('github-activity', 'GitHub Activity',  'Open source contributions and repos',    3),
  ('sports',          'Sports',           'Sports, fitness, and athletics',         4),
  ('random',          'Random',           'Everything else',                        5)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Blogs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blogs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  blocks      JSONB NOT NULL DEFAULT '[]'::jsonb,
  excerpt     TEXT,
  category    TEXT NOT NULL REFERENCES categories(slug),
  published   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blogs_category_idx ON blogs (category);
CREATE INDEX IF NOT EXISTS blogs_published_idx ON blogs (published);
CREATE INDEX IF NOT EXISTS blogs_created_at_idx ON blogs (created_at DESC);
CREATE INDEX IF NOT EXISTS blogs_title_trgm_idx ON blogs USING gin (title gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Semantic search embeddings (one row per blog, re-indexed on content change)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_embeddings (
  blog_id       UUID PRIMARY KEY REFERENCES blogs(id) ON DELETE CASCADE,
  embedding     vector(384) NOT NULL,
  content_hash  TEXT NOT NULL,
  indexed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_embeddings_hnsw_idx
  ON blog_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Updated-at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blogs_updated_at ON blogs;
CREATE TRIGGER blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Semantic search RPC (called from the API via supabase.rpc)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_blogs_semantic(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20,
  filter_category text DEFAULT NULL,
  include_unpublished boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  category text,
  published boolean,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.slug,
    b.excerpt,
    b.category,
    b.published,
    b.created_at,
    1 - (be.embedding <=> query_embedding) AS similarity
  FROM blog_embeddings be
  JOIN blogs b ON b.id = be.blog_id
  WHERE
    (include_unpublished OR b.published = true)
    AND (filter_category IS NULL OR b.category = filter_category)
    AND 1 - (be.embedding <=> query_embedding) >= match_threshold
  ORDER BY be.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The Express API uses the service_role key, which bypasses RLS.
-- These policies protect direct Supabase client access from the browser.
-- ---------------------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Published blogs are publicly readable"
  ON blogs FOR SELECT
  USING (published = true);

CREATE POLICY "Blog embeddings are not directly readable"
  ON blog_embeddings FOR SELECT
  USING (false);

-- ---------------------------------------------------------------------------
-- Short-lived write API keys (minted via POST /api/admin/keys)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label         TEXT NOT NULL,
  key_prefix    TEXT NOT NULL,
  key_hash      TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ,
  last_used_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys (key_hash);
CREATE INDEX IF NOT EXISTS api_keys_active_idx ON api_keys (expires_at) WHERE revoked_at IS NULL;

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
