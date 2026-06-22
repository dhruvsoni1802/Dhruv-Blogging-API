-- Hybrid search: PostgreSQL full-text search (BM25-style ranking) alongside pgvector.
-- Run in Supabase SQL Editor or via `supabase db push` after 001_initial_schema.sql.

ALTER TABLE blogs
  ADD COLUMN IF NOT EXISTS search_text TEXT NOT NULL DEFAULT '';

ALTER TABLE blogs
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(search_text, ''))) STORED;

CREATE INDEX IF NOT EXISTS blogs_search_vector_idx
  ON blogs
  USING gin (search_vector);

-- Backfill search_text from title + excerpt for existing rows (body text filled via API script).
UPDATE blogs
SET search_text = trim(
  coalesce(title, '') ||
  CASE WHEN excerpt IS NOT NULL AND excerpt <> '' THEN E'\n\n' || excerpt ELSE '' END
)
WHERE search_text = '' OR search_text IS NULL;

-- Full-text search RPC (sparse / BM25-style retrieval leg for hybrid search).
CREATE OR REPLACE FUNCTION search_blogs_fulltext(
  search_query text,
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
  rank float
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tsq tsquery;
BEGIN
  IF search_query IS NULL OR btrim(search_query) = '' THEN
    RETURN;
  END IF;

  BEGIN
    tsq := websearch_to_tsquery('english', search_query);
  EXCEPTION WHEN OTHERS THEN
    tsq := plainto_tsquery('english', search_query);
  END;

  IF tsq IS NULL OR tsq = ''::tsquery THEN
    tsq := plainto_tsquery('english', search_query);
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.slug,
    b.excerpt,
    b.category,
    b.published,
    b.created_at,
    ts_rank_cd(b.search_vector, tsq)::float AS rank
  FROM blogs b
  WHERE
    b.search_vector @@ tsq
    AND (include_unpublished OR b.published = true)
    AND (filter_category IS NULL OR b.category = filter_category)
  ORDER BY ts_rank_cd(b.search_vector, tsq) DESC
  LIMIT match_count;
END;
$$;
