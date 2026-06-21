// Category listing and shared validation helpers used by blogController.
import { getAllCategories, isValidCategory } from '../config/categories.js';
import * as categoryModel from '../models/categoryModel.js';
import { slugify } from '../utils/slug.js';

export async function listCategories(_req, res, next) {
  try {
    let categories;
    try {
      categories = await categoryModel.findAllFromDb();
    } catch {
      categories = categoryModel.findAllFromConfig();
    }

    res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

export function validateCategory(category) {
  if (!category) return 'category is required';
  if (!isValidCategory(category)) {
    const valid = getAllCategories()
      .map((c) => c.slug)
      .join(', ');
    return `Invalid category "${category}". Valid: ${valid}`;
  }
  return null;
}

export function resolveSlug(title, providedSlug) {
  return providedSlug ? slugify(providedSlug) : slugify(title);
}
