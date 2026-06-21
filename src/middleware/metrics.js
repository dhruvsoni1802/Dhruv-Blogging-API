// Records HTTP request count and latency for Prometheus.
import {
  httpRequestsTotal,
  httpRequestDuration,
} from '../lib/metrics.js';
import { normalizeRoute, statusClass } from '../utils/metricsHelpers.js';

const SKIP_PATHS = new Set(['/metrics']);

export function metricsMiddleware(req, res, next) {
  if (SKIP_PATHS.has(req.path)) {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const route = normalizeRoute(req);
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_class: statusClass(res.statusCode),
    });

    httpRequestDuration.observe({ method: req.method, route }, durationSec);
  });

  next();
}
