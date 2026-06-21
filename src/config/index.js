import './loadEnv.js';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name, fallback = '') {
  return process.env[name] ?? fallback;
}

function normalizeSupabaseUrl(url) {
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

function getSupabaseProjectRef(url) {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

// Central config — all env vars are read here, nowhere else.
const supabaseUrl = normalizeSupabaseUrl(required('SUPABASE_URL'));

const config = {
  port: parseInt(optional('PORT', '3000'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
  isProduction: optional('NODE_ENV', 'development') === 'production',

  supabase: {
    url: supabaseUrl,
    projectRef: getSupabaseProjectRef(supabaseUrl),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    jwtSecret: optional('SUPABASE_JWT_SECRET'),
  },

  auth: {
    adminApiKey: optional('ADMIN_API_KEY'),
    defaultKeyExpiryHours: parseInt(optional('DEFAULT_KEY_EXPIRY_HOURS', '1'), 10),
  },

  cors: {
    origin: optional('CORS_ORIGIN'),
  },

  embeddings: {
    model: optional('EMBEDDING_MODEL', 'Xenova/bge-small-en-v1.5'),
    dimensions: parseInt(optional('EMBEDDING_DIMENSIONS', '384'), 10),
  },

  search: {
    defaultThreshold: 0.35,
    defaultLimit: 20,
  },

  logging: {
    level: optional('LOG_LEVEL', 'info'),
    pretty: optional('NODE_ENV', 'development') !== 'production',
    axiom: {
      enabled: Boolean(optional('AXIOM_TOKEN') && optional('AXIOM_DATASET')),
      token: optional('AXIOM_TOKEN'),
      dataset: optional('AXIOM_DATASET'),
      edge: optional('AXIOM_EDGE', 'us-east-1.aws.edge.axiom.co'),
    },
  },

  metrics: {
    apiKey: optional('METRICS_API_KEY'),
  },
};

export default config;
