import { Router } from 'express';
import {
  listDeliveries,
  createDelivery,
  updateDeliveryStatus,
  listDeliveryDistricts,
} from '../controllers/deliveryController.js';
import { listDisruptedDeliveries, getRecoveryOptions, applyRecovery } from '../controllers/recoveryController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, listDeliveries);
router.get('/meta/districts', protect, listDeliveryDistricts);
router.get('/disrupted', protect, listDisruptedDeliveries);
router.post('/', protect, createDelivery);
router.patch('/:id/status', protect, updateDeliveryStatus);
router.get('/:id/recovery-options', protect, getRecoveryOptions);
router.post('/:id/apply-recovery', protect, applyRecovery);

export default router;
