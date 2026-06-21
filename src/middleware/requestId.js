// Assigns a unique ID to each request for log and error correlation.
import { randomUUID } from 'crypto';

/**
 * Attach a unique request ID to every request.
 * Clients may pass X-Request-Id; otherwise one is generated.
 * Returned in the X-Request-Id response header for correlation.
 */
export function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
