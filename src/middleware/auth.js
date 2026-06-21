import config from '../config/index.js';
import { unauthorized } from '../errors/ApiError.js';
import { resolveWriteAuth, resolveJwtAuth } from '../services/authService.js';
import { secureCompare } from '../utils/secureCompare.js';

// Protects write routes — short-lived DB keys or Supabase JWT.
export async function requireWriteAccess(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    const apiAuth = await resolveWriteAuth(apiKey);

    if (apiAuth) {
      req.auth = apiAuth;
      return next();
    }

    const jwtAuth = resolveJwtAuth(req.headers.authorization);
    if (jwtAuth) {
      req.auth = jwtAuth;
      return next();
    }

    if (apiKey) {
      return next(unauthorized('Invalid or expired API key'));
    }

    if (req.headers.authorization?.startsWith('Bearer ')) {
      return next(unauthorized('Invalid or expired token'));
    }

    return next(
      unauthorized('Provide a valid X-API-Key or Bearer token to perform this action')
    );
  } catch (err) {
    next(err);
  }
}

export function matchesMetricsKey(provided) {
  if (!config.metrics.apiKey || !provided) return false;
  return secureCompare(provided, config.metrics.apiKey);
}
