import { Router } from 'express';
import { listAlerts, createAlert, markAlertRead, markAllAlertsRead } from '../controllers/alertController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, listAlerts);
router.post('/', protect, createAlert);
router.patch('/:id/read', protect, markAlertRead);
router.post('/mark-all-read', protect, markAllAlertsRead);

export default router;
