import SyncItem from '../models/SyncItem.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// GET /api/sync/status — pending counts + last synced time, for the Data Sync page.
export const syncStatus = asyncHandler(async (req, res) => {
  const [pendingReports, pendingPhotos, lastSynced] = await Promise.all([
    SyncItem.countDocuments({ user: req.user._id, kind: 'report', status: 'pending' }),
    SyncItem.countDocuments({ user: req.user._id, kind: 'photo', status: 'pending' }),
    SyncItem.findOne({ user: req.user._id, status: 'synced' }).sort({ syncedAt: -1 }),
  ]);
  res.json({
    pendingReports,
    pendingPhotos,
    lastSyncedAt: lastSynced?.syncedAt || null,
  });
});

// POST /api/sync/queue — a device (possibly offline-first PWA) queues an item.
export const queueItem = asyncHandler(async (req, res) => {
  const { kind, payload } = req.body;
  if (!['report', 'photo', 'profile', 'other'].includes(kind)) {
    return res.status(400).json({ message: 'Invalid sync item kind.' });
  }
  const item = await SyncItem.create({ user: req.user._id, kind, payload, status: 'pending' });
  res.status(201).json({ item });
});

// POST /api/sync/run — attempt to flush all of this user's pending items.
export const runSync = asyncHandler(async (req, res) => {
  const pending = await SyncItem.find({ user: req.user._id, status: 'pending' });
  const now = new Date();
  await SyncItem.updateMany(
    { _id: { $in: pending.map((p) => p._id) } },
    { status: 'synced', syncedAt: now }
  );
  res.json({ syncedCount: pending.length, syncedAt: now });
});
