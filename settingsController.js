import Settings from '../models/Settings.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const ALLOWED_FIELDS = [
  'notifyCritical',
  'notifyHighRisk',
  'notifyUpdates',
  'notifySound',
  'mapDefaultLayer',
  'mapProvider',
  'refreshIntervalSeconds',
  'theme',
  'language',
];

export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ user: req.user._id });
  if (!settings) settings = await Settings.create({ user: req.user._id });
  res.json({ settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const update = {};
  for (const key of ALLOWED_FIELDS) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  const settings = await Settings.findOneAndUpdate(
    { user: req.user._id },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ settings });
});
