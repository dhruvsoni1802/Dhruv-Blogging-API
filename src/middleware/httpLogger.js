// Logs every HTTP request with method, URL, status, and duration.
import pinoHttp from 'pino-http';
import logger from '../lib/logger.js';

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        requestId: req.id,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
