// Central error handler — catches all thrown errors and returns consistent JSON responses.
import multer from 'multer';
import {
  ApiError,
  formatErrorResponse,
  mapDatabaseError,
  badRequest,
} from '../errors/ApiError.js';
import logger from '../lib/logger.js';

export function notFound(req, res) {
  const log = req.log ?? logger;
  log.warn({ requestId: req.id, method: req.method, url: req.originalUrl }, 'Route not found');

  res.status(404).json(
    formatErrorResponse(new ApiError(404, `No route for ${req.method} ${req.originalUrl}`))
  );
}

export function errorHandler(err, req, res, _next) {
  const log = req.log ?? logger;

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    log.warn({ requestId: req.id, err }, 'Invalid JSON body');
    return res.status(400).json(formatErrorResponse(badRequest('Invalid JSON body')));
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 10MB size limit' : err.message;
    log.warn({ requestId: req.id, err, code: err.code }, message);
    return res.status(400).json(formatErrorResponse(badRequest(message)));
  }

  if (err.message?.startsWith('File type not allowed')) {
    log.warn({ requestId: req.id }, err.message);
    return res.status(400).json(formatErrorResponse(badRequest(err.message)));
  }

  if (!(err instanceof ApiError)) {
    const mapped = mapDatabaseError(err);
    if (mapped) err = mapped;
  }

  if (!(err instanceof ApiError)) {
    log.error({ requestId: req.id, err }, 'Unhandled error');
    err = new ApiError(500, err.message ?? 'Internal Server Error');
  } else if (err.status >= 500) {
    log.error({ requestId: req.id, status: err.status, code: err.code }, err.message);
  } else {
    log.warn({ requestId: req.id, status: err.status, code: err.code }, err.message);
  }

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status).json(formatErrorResponse(err, isDev));
}
