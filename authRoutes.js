import { Router } from 'express';
import { register, login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/register', upload.single('vehiclePhoto'), register);
router.post('/login', login);
router.get('/me', protect, me);

export default router;
