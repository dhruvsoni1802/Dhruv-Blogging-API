// Express app — middleware is applied top-to-bottom before routes run.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/index.js';
import routes from './routes/index.js';
import docsRoutes from './routes/docs.js';
import { getMetrics } from './controllers/metricsController.js';
import { requestId } from './middleware/requestId.js';
import { metricsMiddleware } from './middleware/metrics.js';
import { httpLogger } from './middleware/httpLogger.js';
import { apiRateLimit } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');

if (config.isProduction) {
  app.set('trust proxy', 1);
}

app.use(requestId);
app.use(metricsMiddleware);
app.use(httpLogger);

// Swagger UI before helmet — inline scripts/styles are blocked by default CSP.
app.use('/api', docsRoutes);

app.use(helmet());
app.use(
  cors(
    config.cors.origin
      ? { origin: config.cors.origin, methods: ['GET', 'POST', 'PUT', 'DELETE'] }
      : undefined
  )
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/metrics', getMetrics);
app.use('/api', apiRateLimit, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
