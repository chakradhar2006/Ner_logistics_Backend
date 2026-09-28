import { Router } from 'express';
import { listRoads, createRoad, updateRoadStatus, listDistricts } from '../controllers/roadController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, listRoads);
router.get('/meta/districts', protect, listDistricts);
router.post('/', protect, createRoad);
router.patch('/:id/status', protect, updateRoadStatus);

export default router;
