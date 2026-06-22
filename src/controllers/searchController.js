import config from '../config/index.js';
import * as searchService from '../services/searchService.js';
import { isValidCategory } from '../config/categories.js';
import { badRequest } from '../errors/ApiError.js';

export async function semanticSearch(req, res, next) {
  try {
    const { q, category, limit, include_unpublished } = req.query;

    if (!q?.trim()) {
      throw badRequest('Query parameter "q" is required');
    }

    if (category && !isValidCategory(category)) {
      throw badRequest(`Invalid category "${category}"`);
    }

    const parsedLimit = limit ? parseInt(limit, 10) : searchService.getDefaultSearchLimit();

    if (limit && (Number.isNaN(parsedLimit) || parsedLimit < 1)) {
      throw badRequest('limit must be a positive integer');
    }

    const results = await searchService.hybridSearch({
      query: q,
      category: category ?? null,
      limit: parsedLimit,
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
