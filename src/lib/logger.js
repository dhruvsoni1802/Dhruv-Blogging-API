// Structured logging — outputs JSON in production, pretty text in development.
// Ships to Axiom when AXIOM_TOKEN and AXIOM_DATASET are set.
import pino from 'pino';
import config from '../config/index.js';

function buildTransport() {
  const targets = [];

  if (config.logging.pretty) {
    targets.push({
      target: 'pino-pretty',
      level: config.logging.level,
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    });
  } else {
    targets.push({
      target: 'pino/file',
      options: { destination: 1 },
      level: config.logging.level,
    });
  }

  if (config.logging.axiom.enabled) {
    targets.push({
      target: '@axiomhq/pino',
      level: config.logging.level,
      options: {
        dataset: config.logging.axiom.dataset,
        token: config.logging.axiom.token,
        edge: config.logging.axiom.edge,
      },
    });
  }

  if (targets.length === 1) {
    return pino.transport(targets[0]);
  }

  return pino.transport({ targets });
}

const logger = pino(
  {
    level: config.logging.level,
    base: {
      env: config.nodeEnv,
      service: 'blogging-api',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  buildTransport()
);

export default logger;
