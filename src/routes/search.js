import { Router } from 'express';
import * as searchController from '../controllers/searchController.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { searchRateLimit } from '../middleware/rateLimit.js';

const router = Router();

router.get('/', searchRateLimit, optionalAuth, searchController.semanticSearch);

export default router;
