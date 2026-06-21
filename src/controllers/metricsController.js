import { getMetricsPayload, getMetricsContentType } from '../lib/metrics.js';
import config from '../config/index.js';
import { matchesMetricsKey } from '../middleware/auth.js';
import { unauthorized } from '../errors/ApiError.js';

export async function getMetrics(req, res, next) {
  try {
    if (config.isProduction || config.metrics.apiKey) {
      const key = req.headers['x-api-key'];
      if (!matchesMetricsKey(key)) {
        throw unauthorized('Valid X-API-Key required to access metrics');
      }
    }

    res.set('Content-Type', getMetricsContentType());
    res.status(200).send(await getMetricsPayload());
  } catch (err) {
    next(err);
  }
}
