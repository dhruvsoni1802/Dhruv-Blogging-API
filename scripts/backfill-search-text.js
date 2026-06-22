// Backfills blogs.search_text from title + excerpt + block plain text.
// Run after applying 002_hybrid_search.sql: npm run backfill-search
import '../src/config/loadEnv.js';
import * as blogModel from '../src/models/blogModel.js';
import { buildSearchText } from '../src/utils/searchText.js';

const { blogs } = await blogModel.findAll({ published: undefined, limit: 1000 });

let updated = 0;

for (const blog of blogs) {
  const searchText = buildSearchText(blog);
  await blogModel.updateSearchText(blog.id, searchText);
  updated++;
  console.log(`Updated search_text: ${blog.slug}`);
}

console.log(`Done. Updated ${updated} blog(s).`);
