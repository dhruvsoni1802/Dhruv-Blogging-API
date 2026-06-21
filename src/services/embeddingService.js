// Builds local BGE embeddings and stores them in Supabase for semantic search.
import { pipeline } from '@xenova/transformers';
import config from '../config/index.js';
import logger from '../lib/logger.js';
import {
  recordEmbeddingIndexSuccess,
  recordEmbeddingIndexFailure,
} from '../lib/metrics.js';
import * as blogModel from '../models/blogModel.js';
import { blocksToPlainText } from '../utils/blocks.js';
import { contentHash } from '../utils/hash.js';

let extractor = null;
let loadPromise = null;

const QUERY_PREFIX = 'Represent this sentence for searching relevant passages: ';

async function getExtractor() {
  if (extractor) return extractor;

  if (!loadPromise) {
    loadPromise = pipeline('feature-extraction', config.embeddings.model, {
      quantized: true,
    }).then((pipe) => {
      extractor = pipe;
      return pipe;
    });
  }

  return loadPromise;
}

async function createEmbedding(text, { isQuery = false } = {}) {
  const pipe = await getExtractor();
  const input = isQuery ? `${QUERY_PREFIX}${text}` : text;
  const output = await pipe(input, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

function buildIndexText(blog) {
  const plainText = blocksToPlainText(blog.blocks);
  const parts = [blog.title, blog.excerpt, plainText].filter(Boolean);
  return parts.join('\n\n').slice(0, 8000);
}

export async function warmUpEmbeddingModel() {
  logger.info({ model: config.embeddings.model }, 'Loading embedding model');
  await createEmbedding('warm up', { isQuery: true });
  logger.info({ model: config.embeddings.model }, 'Embedding model ready');
}

export async function indexBlog(blog) {
  try {
    const hash = contentHash(blog.title, blog.blocks, blog.excerpt);
    const text = buildIndexText(blog);
    const embedding = await createEmbedding(text);

    await blogModel.upsertEmbedding(blog.id, embedding, hash);
    recordEmbeddingIndexSuccess();
    logger.debug({ blogId: blog.id }, 'Blog indexed for semantic search');
  } catch (err) {
    recordEmbeddingIndexFailure();
    throw err;
  }
}

export async function embedQuery(query) {
  return createEmbedding(query, { isQuery: true });
}

export async function reindexBlogIfChanged(blog, previousHash) {
  const hash = contentHash(blog.title, blog.blocks, blog.excerpt);
  if (hash === previousHash) return;

  await indexBlog(blog);
}
