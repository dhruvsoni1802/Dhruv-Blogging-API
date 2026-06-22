import { blocksToPlainText } from './blocks.js';

export function buildSearchText({ title, excerpt, blocks }) {
  const plainText = blocks ? blocksToPlainText(blocks) : '';
  return [title, excerpt, plainText].filter(Boolean).join('\n\n').trim();
}

export function buildRerankPassage({ title, excerpt, blocks, search_text }) {
  if (search_text?.trim()) {
    return search_text.trim().slice(0, 1500);
  }

  return buildSearchText({ title, excerpt, blocks }).slice(0, 1500);
}
