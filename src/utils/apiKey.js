import { createHash, randomBytes } from 'crypto';

const KEY_PREFIX = 'blk_';

export function hashApiKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

export function generateApiKey() {
  const secret = randomBytes(32).toString('hex');
  const key = `${KEY_PREFIX}${secret}`;
  const keyPrefix = key.slice(0, 12);

  return {
    key,
    keyPrefix,
    keyHash: hashApiKey(key),
  };
}
