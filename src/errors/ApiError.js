// Typed HTTP errors — throw these from controllers, errorHandler formats the response.
export class ApiError extends Error {
  constructor(status, message, code = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code ?? STATUS_CODES[status] ?? 'ERROR';
  }
}

const STATUS_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  500: 'INTERNAL_SERVER_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

const STATUS_LABELS = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

export function badRequest(message) {
  return new ApiError(400, message);
}

export function unauthorized(message = 'Authentication required') {
  return new ApiError(401, message);
}

export function forbidden(message = 'Forbidden') {
  return new ApiError(403, message);
}

export function notFound(message = 'Resource not found') {
  return new ApiError(404, message);
}

export function conflict(message) {
  return new ApiError(409, message);
}

export function internal(message = 'Internal Server Error') {
  return new ApiError(500, message);
}

export function serviceUnavailable(message) {
  return new ApiError(503, message);
}

export function formatErrorResponse(err, isDev = false) {
  const status = err.status ?? err.statusCode ?? 500;
  const isServerError = status >= 500;

  const body = {
    status,
    error: STATUS_LABELS[status] ?? 'Error',
    message: isServerError ? 'Internal Server Error' : err.message,
  };

  if (err.code && typeof err.code === 'string' && !err.code.match(/^\d/)) {
    body.code = err.code;
  }

  if (isDev && isServerError && err.stack) {
    body.stack = err.stack;
  }

  return body;
}

export function mapDatabaseError(err) {
  switch (err.code) {
    case '23505':
      return conflict('A record with this value already exists');
    case '23503':
      return badRequest('Referenced record does not exist');
    case '22P02':
      return badRequest('Invalid ID format');
    case 'PGRST125':
      return badRequest(
        'Supabase URL misconfigured — use the project URL only (https://xxx.supabase.co), not /rest/v1'
      );
    case 'PGRST205':
      return badRequest('Database table not found — run supabase/migrations/001_initial_schema.sql');
    default:
      return null;
  }
}
