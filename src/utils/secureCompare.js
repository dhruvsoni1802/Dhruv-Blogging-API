import { timingSafeEqual } from 'crypto';

/** Constant-time string comparison to prevent timing attacks on API keys. */
export function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) return false;

  return timingSafeEqual(bufA, bufB);
}
