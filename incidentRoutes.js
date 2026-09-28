import { Router } from 'express';
import { listIncidents, getIncident, createIncident, updateIncidentStatus } from '../controllers/incidentController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', protect, listIncidents);
router.get('/:id', protect, getIncident);
router.post('/', protect, upload.single('photo'), createIncident);
router.patch('/:id/status', protect, updateIncidentStatus);

export default router;
