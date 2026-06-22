import config from '../config/index.js';
import * as blogModel from '../models/blogModel.js';
import { embedQuery } from '../services/embeddingService.js';
import { rerankCandidates } from '../services/rerankService.js';
import { reciprocalRankFusion } from '../utils/rrf.js';

function toSearchResult(item) {
  const score = item.rerankScore ?? item.rrfScore ?? item.similarity ?? item.rank ?? 0;

  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    category: item.category,
    published: item.published,
    created_at: item.created_at,
    similarity: score,
    match: item.rerankScore != null ? 'rerank' : 'hybrid',
  };
}

export async function hybridSearch({
  query,
  category,
  limit,
  includeUnpublished,
}) {
  const trimmed = query.trim();
  const retrievalLimit = config.search.retrievalLimit;

  const embedding = await embedQuery(trimmed);

  const [denseResults, sparseResults] = await Promise.all([
    blogModel.semanticSearch({
      embedding,
      threshold: 0,
      limit: retrievalLimit,
      category,
      includeUnpublished,
    }),
    blogModel.fullTextSearch({
      query: trimmed,
      limit: retrievalLimit,
      category,
      includeUnpublished,
    }),
  ]);

  if (!denseResults.length && !sparseResults.length) {
    return [];
  }

  const fused = reciprocalRankFusion([denseResults, sparseResults], {
    k: config.search.rrfK,
  }).slice(0, config.search.rerankCandidateLimit);

  const reranked = await rerankCandidates(trimmed, fused);

  return reranked.slice(0, limit).map(toSearchResult);
}

export function getDefaultSearchLimit() {
  return config.search.defaultLimit;
}
