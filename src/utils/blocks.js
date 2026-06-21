// Post content format — blocks are an ordered list of paragraphs and media references.
const PARAGRAPH = 'paragraph';
const MEDIA = 'media';

const VALID_TYPES = new Set([PARAGRAPH, MEDIA]);

export function blocksToPlainText(blocks) {
  if (!Array.isArray(blocks)) return '';

  return blocks
    .map((block) => {
      if (block.type === PARAGRAPH) return block.text ?? '';
      if (block.type === MEDIA) {
        return [block.alt, block.caption].filter(Boolean).join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

export function generateExcerpt(blocks, maxLength = 200) {
  const text = blocksToPlainText(blocks).replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function validateBlocks(blocks) {
  if (!Array.isArray(blocks)) {
    return 'blocks must be an array';
  }

  if (blocks.length === 0) {
    return 'blocks must contain at least one block';
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const label = `blocks[${i}]`;

    if (!block || typeof block !== 'object') {
      return `${label} must be an object`;
    }

    if (!VALID_TYPES.has(block.type)) {
      return `${label}.type must be "paragraph" or "media"`;
    }

    if (block.type === PARAGRAPH) {
      if (typeof block.text !== 'string') {
        return `${label}.text must be a string`;
      }
      continue;
    }

    if (typeof block.url !== 'string' || !block.url.trim()) {
      return `${label}.url is required for media blocks`;
    }

    if (typeof block.mimeType !== 'string' || !block.mimeType.trim()) {
      return `${label}.mimeType is required for media blocks`;
    }

    if (block.alt !== undefined && typeof block.alt !== 'string') {
      return `${label}.alt must be a string`;
    }

    if (block.caption !== undefined && typeof block.caption !== 'string') {
      return `${label}.caption must be a string`;
    }
  }

  return null;
}

export function normalizeBlocks(blocks) {
  return blocks.map((block) => {
    if (block.type === PARAGRAPH) {
      return { type: PARAGRAPH, text: block.text };
    }

    const normalized = {
      type: MEDIA,
      url: block.url.trim(),
      mimeType: block.mimeType.trim(),
    };

    if (block.alt?.trim()) normalized.alt = block.alt.trim();
    if (block.caption?.trim()) normalized.caption = block.caption.trim();

    return normalized;
  });
}
