import config from '../config/index.js';
import { unauthorized } from '../errors/ApiError.js';
import { isAdminKey } from '../services/authService.js';

// Only the long-lived ADMIN_API_KEY can access /api/admin/* routes.
export function requireAdmin(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!config.auth.adminApiKey) {
    return next(unauthorized('Admin API is not configured'));
  }

  if (!isAdminKey(apiKey)) {
    return next(unauthorized('Valid admin X-API-Key required'));
  }

  req.auth = { method: 'admin' };
  next();
}
