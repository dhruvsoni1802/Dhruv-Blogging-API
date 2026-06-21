import config from './index.js';

/** Fail fast in production if critical security config is missing. */
export function validateProductionConfig() {
  if (config.nodeEnv !== 'production') return;

  const errors = [];

  if (!config.auth.adminApiKey) {
    errors.push('ADMIN_API_KEY must be set in production');
  }

  if (!config.metrics.apiKey) {
    errors.push('METRICS_API_KEY must be set in production');
  }

  if (!config.cors.origin) {
    errors.push('CORS_ORIGIN must be set in production (your frontend URL)');
  }

  if (errors.length > 0) {
    throw new Error(`Production config invalid:\n- ${errors.join('\n- ')}`);
  }
}
