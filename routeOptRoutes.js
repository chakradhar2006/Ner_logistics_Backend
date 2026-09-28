import { Router } from 'express';
import { optimizeRoute, listRouteHistory } from '../controllers/routeOptController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/optimize', protect, optimizeRoute);
router.get('/history', protect, listRouteHistory);

export default router;
