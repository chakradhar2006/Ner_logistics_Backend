import { Router } from 'express';
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController.js';
import { getVehicleRoute } from '../controllers/recoveryController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', protect, listVehicles);
router.get('/:id', protect, getVehicle);
router.get('/:id/route', protect, getVehicleRoute);
router.post('/', protect, requireRole('admin', 'driver'), upload.single('photo'), createVehicle);
router.patch('/:id', protect, requireRole('admin', 'driver'), updateVehicle);
router.delete('/:id', protect, requireRole('admin'), deleteVehicle);

export default router;
