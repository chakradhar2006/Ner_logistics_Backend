import { Router } from 'express';
import { currentWeather, disasterFeed } from '../controllers/weatherController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Weather is not sensitive, but we still gate it behind auth for consistency
// with the rest of the API. Drop `protect` here if you want a public widget.
router.get('/current', protect, currentWeather);
router.get('/disaster-feed', protect, disasterFeed);

export default router;
