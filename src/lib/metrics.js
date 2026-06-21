// Prometheus metrics — scraped from GET /metrics.
import client from 'prom-client';

export const register = new client.Registry();

register.setDefaultLabels({ service: 'blogging-api' });

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_class'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const embeddingIndexTotal = new client.Counter({
  name: 'embedding_index_total',
  help: 'Blog embedding index attempts',
  labelNames: ['result'],
  registers: [register],
});

export const processUp = new client.Gauge({
  name: 'process_up',
  help: '1 if the process is up',
  registers: [register],
});

export function recordEmbeddingIndexSuccess() {
  embeddingIndexTotal.inc({ result: 'success' });
}

export function recordEmbeddingIndexFailure() {
  embeddingIndexTotal.inc({ result: 'failure' });
}

export async function getMetricsPayload() {
  return register.metrics();
}

export function getMetricsContentType() {
  return register.contentType;
}
