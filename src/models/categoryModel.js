// Category queries — reads from Supabase, falls back to config/categories.js in dev.
import supabase from '../services/supabase.js';
import { getAllCategories } from '../config/categories.js';

export async function findAllFromDb() {
  const { data, error } = await supabase
    .from('categories')
    .select('slug, label, description, sort_order')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
}

/** Fallback to in-code config if DB is unavailable during dev setup */
export function findAllFromConfig() {
  return getAllCategories().map((c, i) => ({
    slug: c.slug,
    label: c.label,
    description: c.description,
    sort_order: i + 1,
  }));
}
