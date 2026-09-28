import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import connectDB from './src/config/db.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';

import authRoutes from './src/routes/authRoutes.js';
import vehicleRoutes from './src/routes/vehicleRoutes.js';
import deliveryRoutes from './src/routes/deliveryRoutes.js';
import roadRoutes from './src/routes/roadRoutes.js';
import incidentRoutes from './src/routes/incidentRoutes.js';
import alertRoutes from './src/routes/alertRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import syncRoutes from './src/routes/syncRoutes.js';
import routeOptRoutes from './src/routes/routeOptRoutes.js';
import weatherRoutes from './src/routes/weatherRoutes.js';
import velocityRoutes from './src/routes/velocityRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import sseRoutes from './src/routes/sseRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false })); // allow /uploads images to load cross-origin
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Basic rate limiting on auth endpoints to slow down credential stuffing.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use('/api/auth', authLimiter);

// Serve uploaded incident/vehicle photos.
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/roads', roadRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/routes', routeOptRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/velocity', velocityRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/events', sseRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NER Logistics backend listening on http://localhost:${PORT}`);
});
