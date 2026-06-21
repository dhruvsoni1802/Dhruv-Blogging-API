import { createHash } from 'crypto';
import { blocksToPlainText } from './blocks.js';

export function contentHash(title, blocks, excerpt) {
  const plainText = Array.isArray(blocks) ? blocksToPlainText(blocks) : '';
  return createHash('sha256')
    .update(`${title}\n${excerpt ?? ''}\n${plainText}`)
    .digest('hex');
}
