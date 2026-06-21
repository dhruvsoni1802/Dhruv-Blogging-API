#!/usr/bin/env node
/**
 * Dev-only seed — inserts sample data into the DEV Supabase project.
 * Refuses to run when NODE_ENV=production.
 */
import config from '../src/config/index.js';
import supabase from '../src/services/supabase.js';

if (config.isProduction) {
  console.error('Refusing to seed: NODE_ENV is production');
  process.exit(1);
}

console.log(`Seeding dev database (project: ${config.supabase.projectRef ?? 'unknown'})`);

const { count, error: countError } = await supabase
  .from('blogs')
  .select('*', { count: 'exact', head: true });

if (countError) {
  console.error('Seed failed:', countError.message);
  process.exit(1);
}

if (count > 0) {
  console.log(`Skipping — ${count} blog(s) already exist`);
  process.exit(0);
}

const { data, error } = await supabase
  .from('blogs')
  .insert({
    title: 'Welcome to the dev blog',
    slug: 'welcome-to-the-dev-blog',
    category: 'random',
    published: true,
    excerpt: 'Sample post created by npm run seed for local development.',
    blocks: [
      {
        type: 'paragraph',
        text: 'This post only exists in your development database. Delete it anytime.',
      },
    ],
  })
  .select('id, title, slug')
  .single();

if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}

console.log('Created sample blog:', data);
console.log('Run semantic reindex after first start if search should include this post.');
