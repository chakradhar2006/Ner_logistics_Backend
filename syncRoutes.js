import { Router } from 'express';
import { syncStatus, queueItem, runSync } from '../controllers/syncController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/status', protect, syncStatus);
router.post('/queue', protect, queueItem);
router.post('/run', protect, runSync);

export default router;
