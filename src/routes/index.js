import { Router } from 'express';
import blogRoutes from './blogs.js';
import categoryRoutes from './categories.js';
import searchRoutes from './search.js';
import adminRoutes from './admin.js';

// All API routes live under /api — mounted from app.js.
const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/categories', categoryRoutes);
router.use('/blogs', blogRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);

export default router;
