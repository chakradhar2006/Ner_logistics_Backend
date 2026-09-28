import Alert from '../models/Alert.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { broadcast } from '../utils/sseHub.js';

export const listAlerts = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const [alerts, unreadCount] = await Promise.all([
    Alert.find().sort({ createdAt: -1 }).limit(Number(limit)),
    Alert.countDocuments({ read: false }),
  ]);
  res.json({ alerts, unreadCount });
});

export const createAlert = asyncHandler(async (req, res) => {
  const { tag, title, description } = req.body;
  if (!tag || !title) return res.status(400).json({ message: 'tag and title are required.' });
  const alert = await Alert.create({ tag, title, description, source: 'manual' });
  broadcast('alert:new', { alert });
  res.status(201).json({ alert });
});

// PATCH /api/alerts/:id/read
export const markAlertRead = asyncHandler(async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  if (!alert) return res.status(404).json({ message: 'Alert not found.' });
  res.json({ alert });
});

// POST /api/alerts/mark-all-read
export const markAllAlertsRead = asyncHandler(async (req, res) => {
  const result = await Alert.updateMany({ read: false }, { read: true });
  res.json({ updated: result.modifiedCount ?? result.nModified ?? 0 });
});
