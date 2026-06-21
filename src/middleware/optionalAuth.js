import { resolveWriteAuth, resolveJwtAuth } from '../services/authService.js';

// Same as requireWriteAccess but never rejects — used on public read routes
// so authenticated users can see unpublished posts.
export async function optionalAuth(req, _res, next) {
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
    }

    next();
  } catch (err) {
    next(err);
  }
}
