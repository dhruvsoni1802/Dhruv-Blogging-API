// Blog request handlers — validate input, call the model, trigger background indexing.
import * as blogModel from '../models/blogModel.js';
import { indexBlog } from '../services/embeddingService.js';
import {
  validateBlocks,
  normalizeBlocks,
  generateExcerpt,
} from '../utils/blocks.js';
import { badRequest, notFound } from '../errors/ApiError.js';
import logger from '../lib/logger.js';
import { uploadMedia } from '../services/storageService.js';
import {
  validateCategory,
  resolveSlug,
} from './categoryController.js';

function parseBool(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  return value === 'true';
}

function resolveExcerpt(blocks, providedExcerpt) {
  if (providedExcerpt !== undefined && providedExcerpt !== null) {
    return providedExcerpt.trim() || null;
  }
  return generateExcerpt(blocks);
}

export async function listBlogs(req, res, next) {
  try {
    const { category, limit, offset } = req.query;
    const published = parseBool(req.query.published, true);

    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
      throw badRequest('limit must be a positive integer');
    }
    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
      throw badRequest('offset must be a non-negative integer');
    }

    const { blogs, total } = await blogModel.findAll({
      category,
      published,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    res.status(200).json({ blogs, total });
  } catch (err) {
    next(err);
  }
}

export async function getBlogBySlug(req, res, next) {
  try {
    const includeUnpublished = Boolean(req.auth);
    const blog = await blogModel.findBySlug(req.params.slug, { includeUnpublished });

    if (!blog) {
      throw notFound('Blog not found');
    }

    res.status(200).json({ blog });
  } catch (err) {
    next(err);
  }
}

export async function getBlogById(req, res, next) {
  try {
    const blog = await blogModel.findById(req.params.id);

    if (!blog || (!blog.published && !req.auth)) {
      throw notFound('Blog not found');
    }

    res.status(200).json({ blog });
  } catch (err) {
    next(err);
  }
}

export async function createBlog(req, res, next) {
  try {
    const { title, blocks, excerpt, category, published, slug: rawSlug } = req.body;

    if (!title?.trim()) {
      throw badRequest('title is required');
    }

    const blocksError = validateBlocks(blocks);
    if (blocksError) {
      throw badRequest(blocksError);
    }

    const categoryError = validateCategory(category);
    if (categoryError) {
      throw badRequest(categoryError);
    }

    const normalizedBlocks = normalizeBlocks(blocks);
    const slug = resolveSlug(title, rawSlug);

    const blog = await blogModel.create({
      title: title.trim(),
      slug,
      blocks: normalizedBlocks,
      excerpt: resolveExcerpt(normalizedBlocks, excerpt),
      category,
      published: parseBool(published, false),
    });

    indexBlog(blog).catch((err) =>
      logger.error({ err, blogId: blog.id, requestId: req.id }, 'Failed to index new blog')
    );

    res.status(201).json({ blog });
  } catch (err) {
    next(err);
  }
}

export async function updateBlog(req, res, next) {
  try {
    const existing = await blogModel.findById(req.params.id);
    if (!existing) {
      throw notFound('Blog not found');
    }

    const { title, blocks, excerpt, category, published, slug: rawSlug } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (!title.trim()) throw badRequest('title cannot be empty');
      updates.title = title.trim();
    }

    if (blocks !== undefined) {
      const blocksError = validateBlocks(blocks);
      if (blocksError) {
        throw badRequest(blocksError);
      }
      updates.blocks = normalizeBlocks(blocks);
    }

    if (excerpt !== undefined) {
      updates.excerpt = excerpt.trim() || null;
    } else if (blocks !== undefined) {
      updates.excerpt = generateExcerpt(updates.blocks);
    }

    if (published !== undefined) {
      updates.published = parseBool(published, existing.published);
    }

    if (category !== undefined) {
      const categoryError = validateCategory(category);
      if (categoryError) {
        throw badRequest(categoryError);
      }
      updates.category = category;
    }

    if (rawSlug !== undefined) {
      updates.slug = resolveSlug(title ?? existing.title, rawSlug);
    } else if (title !== undefined && rawSlug === undefined) {
      updates.slug = resolveSlug(title, existing.slug);
    }

    const blog = await blogModel.update(req.params.id, updates);

    indexBlog(blog).catch((err) =>
      logger.error({ err, blogId: blog.id, requestId: req.id }, 'Failed to re-index blog')
    );

    res.status(200).json({ blog });
  } catch (err) {
    next(err);
  }
}

export async function deleteBlog(req, res, next) {
  try {
    const existing = await blogModel.findById(req.params.id);
    if (!existing) {
      throw notFound('Blog not found');
    }

    await blogModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function reindexBlog(req, res, next) {
  try {
    const blog = await blogModel.findById(req.params.id);
    if (!blog) {
      throw notFound('Blog not found');
    }

    await indexBlog(blog);
    res.status(200).json({ message: 'Blog indexed successfully', blogId: blog.id });
  } catch (err) {
    next(err);
  }
}

export async function reindexAll(_req, res, next) {
  try {
    const { blogs } = await blogModel.findAll({ published: undefined, limit: 1000 });
    const results = { indexed: 0, failed: 0 };

    for (const blog of blogs) {
      try {
        await indexBlog(blog);
        results.indexed++;
      } catch (err) {
        logger.error({ err, blogId: blog.id }, 'Failed to index blog during reindex-all');
        results.failed++;
      }
    }

    res.status(200).json(results);
  } catch (err) {
    next(err);
  }
}

export async function uploadBlogMedia(req, res, next) {
  try {
    if (!req.file) {
      throw badRequest('file is required');
    }

    const media = await uploadMedia(req.file);
    res.status(201).json({ media });
  } catch (err) {
    next(err);
  }
}
