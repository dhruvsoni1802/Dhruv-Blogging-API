import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { writeRateLimit } from '../middleware/rateLimit.js';

const router = Router();

router.use(requireAdmin);

router.post('/keys', writeRateLimit, adminController.createKey);
router.post('/keys/cleanup', writeRateLimit, adminController.cleanupExpiredKeys);
router.get('/keys', adminController.listKeys);
router.delete('/keys/:id', adminController.revokeKey);

export default router;
