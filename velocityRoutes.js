import { Router } from 'express';
import { chat } from '../controllers/velocityController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/chat', protect, chat);

export default router;
