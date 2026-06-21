// Application entry point — validates config, starts the server, handles shutdown.
import app from './app.js';
import config from './config/index.js';
import { validateProductionConfig } from './config/validate.js';
import logger from './lib/logger.js';
import { processUp } from './lib/metrics.js';
import { warmUpEmbeddingModel } from './services/embeddingService.js';

validateProductionConfig();

const server = app.listen(config.port, () => {
  processUp.set(1);

  logger.info(
    {
      port: config.port,
      env: config.nodeEnv,
      supabaseProject: config.supabase.projectRef,
      embeddingModel: config.embeddings.model,
      axiomEnabled: config.logging.axiom.enabled,
    },
    'Blog API started'
  );

  warmUpEmbeddingModel().catch((err) => {
    logger.warn({ err }, 'Embedding model warm-up failed');
  });
});

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  processUp.set(0);

  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
