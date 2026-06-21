import { Router } from 'express';
import multer from 'multer';
import * as blogController from '../controllers/blogController.js';
import { requireWriteAccess } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { writeRateLimit } from '../middleware/rateLimit.js';

const router = Router();

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

function uploadSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) return next(err);
    next();
  });
}

router.get('/', optionalAuth, blogController.listBlogs);
router.get('/slug/:slug', optionalAuth, blogController.getBlogBySlug);

router.post('/', writeRateLimit, requireWriteAccess, blogController.createBlog);
router.post('/reindex-all', writeRateLimit, requireWriteAccess, blogController.reindexAll);
router.post(
  '/media',
  writeRateLimit,
  requireWriteAccess,
  uploadSingle,
  blogController.uploadBlogMedia
);

router.get('/:id', optionalAuth, blogController.getBlogById);
router.put('/:id', writeRateLimit, requireWriteAccess, blogController.updateBlog);
router.delete('/:id', writeRateLimit, requireWriteAccess, blogController.deleteBlog);
router.post('/:id/reindex', writeRateLimit, requireWriteAccess, blogController.reindexBlog);

export default router;
