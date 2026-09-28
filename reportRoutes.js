import { Router } from 'express';
import { listReports, generateReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, listReports);
router.post('/generate', protect, generateReport);

export default router;
