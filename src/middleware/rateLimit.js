import rateLimit from 'express-rate-limit';

/** General limit for all API routes. */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: 'Too Many Requests', message: 'Rate limit exceeded' },
});

/** Stricter limit for write operations and expensive endpoints. */
export const writeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: 'Too Many Requests', message: 'Rate limit exceeded' },
});

/** Semantic search runs local ML inference — keep this tighter than reads. */
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: 'Too Many Requests', message: 'Rate limit exceeded' },
});
