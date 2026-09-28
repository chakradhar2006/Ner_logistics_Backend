import Road from '../models/Road.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { broadcast } from '../utils/sseHub.js';

export const listRoads = asyncHandler(async (req, res) => {
  const { district, status, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (district && district !== 'All Districts') filter.district = district;
  if (status && status !== 'All') filter.status = status;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [roads, total] = await Promise.all([
    Road.find(filter).sort({ lastUpdatedAt: -1 }).skip(skip).limit(Number(limit)),
    Road.countDocuments(filter),
  ]);
  res.json({ roads, total, page: Number(page), limit: Number(limit) });
});

export const createRoad = asyncHandler(async (req, res) => {
  const road = await Road.create({ ...req.body, lastUpdatedAt: new Date() });
  res.status(201).json({ road });
});

export const updateRoadStatus = asyncHandler(async (req, res) => {
  const { status, riskLevel, riskReason } = req.body;
  const update = { lastUpdatedAt: new Date() };
  if (status) update.status = status;
  if (riskLevel) update.riskLevel = riskLevel;
  if (riskReason !== undefined) update.riskReason = riskReason;

  const road = await Road.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!road) return res.status(404).json({ message: 'Road not found.' });
  broadcast('road:updated', { road });
  res.json({ road });
});

// GET /api/roads/meta/districts — distinct district list for filter dropdowns.
export const listDistricts = asyncHandler(async (req, res) => {
  const districts = await Road.distinct('district');
  res.json({ districts: districts.filter(Boolean).sort() });
});
