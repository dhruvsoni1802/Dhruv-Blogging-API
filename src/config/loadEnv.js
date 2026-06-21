import { existsSync } from 'fs';
import dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV || 'development';

// Base file, then environment-specific, then local overrides (highest priority).
dotenv.config({ path: '.env' });

if (existsSync(`.env.${nodeEnv}`)) {
  dotenv.config({ path: `.env.${nodeEnv}`, override: true });
}

if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}
