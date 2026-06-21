/**
 * Blog categories — extend this list and add a matching row in
 * supabase/migrations/ to keep the database in sync.
 */
export const CATEGORIES = [
  {
    slug: 'tech',
    label: 'Tech',
    description: 'Technology, programming, and engineering',
  },
  {
    slug: 'projects',
    label: 'Projects',
    description: 'Personal and side projects',
  },
  {
    slug: 'github-activity',
    label: 'GitHub Activity',
    description: 'Open source contributions and repos',
  },
  {
    slug: 'sports',
    label: 'Sports',
    description: 'Sports, fitness, and athletics',
  },
  {
    slug: 'random',
    label: 'Random',
    description: 'Everything else',
  },
];

const slugSet = new Set(CATEGORIES.map((c) => c.slug));

export function isValidCategory(slug) {
  return slugSet.has(slug);
}

export function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function getAllCategories() {
  return CATEGORIES;
}
