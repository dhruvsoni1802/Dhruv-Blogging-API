// Data access layer for blogs — all Supabase queries for posts and embeddings live here.
import supabase from '../services/supabase.js';

const BLOG_COLUMNS =
  'id, title, slug, blocks, excerpt, category, published, created_at, updated_at';

const BLOG_LIST_COLUMNS =
  'id, title, slug, excerpt, category, published, created_at, updated_at';

export async function findAll({ category, published, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('blogs')
    .select(BLOG_LIST_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq('category', category);
  if (published !== undefined) query = query.eq('published', published);

  const { data, error, count } = await query;
  if (error) throw error;
  return { blogs: data, total: count };
}

export async function findById(id) {
  const { data, error } = await supabase
    .from('blogs')
    .select(BLOG_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function findBySlug(slug, { includeUnpublished = false } = {}) {
  let query = supabase.from('blogs').select(BLOG_COLUMNS).eq('slug', slug);

  if (!includeUnpublished) {
    query = query.eq('published', true);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function create(blog) {
  const { data, error } = await supabase
    .from('blogs')
    .insert(blog)
    .select(BLOG_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

export async function update(id, updates) {
  const { data, error } = await supabase
    .from('blogs')
    .update(updates)
    .eq('id', id)
    .select(BLOG_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

export async function remove(id) {
  const { error } = await supabase.from('blogs').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertEmbedding(blogId, embedding, hash) {
  const { error } = await supabase.from('blog_embeddings').upsert(
    {
      blog_id: blogId,
      embedding,
      content_hash: hash,
      indexed_at: new Date().toISOString(),
    },
    { onConflict: 'blog_id' }
  );

  if (error) throw error;
}

export async function semanticSearch({
  embedding,
  threshold,
  limit,
  category,
  includeUnpublished,
}) {
  const { data, error } = await supabase.rpc('search_blogs_semantic', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    filter_category: category ?? null,
    include_unpublished: includeUnpublished ?? false,
  });

  if (error) throw error;
  return data;
}
