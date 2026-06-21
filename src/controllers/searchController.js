// Semantic search — embeds the query locally, then searches via Supabase pgvector.
import config from '../config/index.js';
import * as blogModel from '../models/blogModel.js';
import { embedQuery } from '../services/embeddingService.js';
import { isValidCategory } from '../config/categories.js';
import { badRequest } from '../errors/ApiError.js';

export async function semanticSearch(req, res, next) {
  try {
    const { q, category, limit, threshold, include_unpublished } = req.query;

    if (!q?.trim()) {
      throw badRequest('Query parameter "q" is required');
    }

    if (category && !isValidCategory(category)) {
      throw badRequest(`Invalid category "${category}"`);
    }

    const parsedLimit = limit ? parseInt(limit, 10) : config.search.defaultLimit;
    const parsedThreshold = threshold ? parseFloat(threshold) : config.search.defaultThreshold;

    if (limit && (Number.isNaN(parsedLimit) || parsedLimit < 1)) {
      throw badRequest('limit must be a positive integer');
    }

    if (threshold && (Number.isNaN(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 1)) {
      throw badRequest('threshold must be a number between 0 and 1');
    }

    const embedding = await embedQuery(q.trim());

    const results = await blogModel.semanticSearch({
      embedding,
      threshold: parsedThreshold,
      limit: parsedLimit,
      category: category ?? null,
      includeUnpublished: include_unpublished === 'true' && Boolean(req.auth),
    });

    res.status(200).json({
      query: q,
      results,
      count: results.length,
    });
  } catch (err) {
    next(err);
  }
}
