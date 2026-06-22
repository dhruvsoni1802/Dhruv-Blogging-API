import { pipeline } from '@xenova/transformers';
import config from '../config/index.js';
import logger from '../lib/logger.js';
import { buildRerankPassage } from '../utils/searchText.js';

let reranker = null;
let loadPromise = null;

async function getReranker() {
  if (reranker) return reranker;

  if (!loadPromise) {
    loadPromise = pipeline('text-classification', config.search.rerankModel, {
      quantized: true,
    }).then((pipe) => {
      reranker = pipe;
      return pipe;
    });
  }

  return loadPromise;
}

export async function warmUpReranker() {
  if (!config.search.rerankEnabled) return;

  logger.info({ model: config.search.rerankModel }, 'Loading reranker model');
  const pipe = await getReranker();
  await pipe('warm up[SEP]warm up passage', { topk: 1 });
  logger.info({ model: config.search.rerankModel }, 'Reranker model ready');
}

export async function rerankCandidates(query, candidates) {
  if (!config.search.rerankEnabled || candidates.length <= 1) {
    return candidates;
  }

  const pipe = await getReranker();
  const trimmedQuery = query.trim();

  const scored = await Promise.all(
    candidates.map(async (candidate) => {
      const passage = buildRerankPassage(candidate);
      const output = await pipe(`${trimmedQuery}[SEP]${passage}`, { topk: 1 });
      const rerankScore = output[0]?.score ?? 0;

      return {
        ...candidate,
        rerankScore,
      };
    })
  );

  return scored.sort((a, b) => b.rerankScore - a.rerankScore);
}
