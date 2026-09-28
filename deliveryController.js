import Delivery from '../models/Delivery.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { broadcast } from '../utils/sseHub.js';

export const listDeliveries = asyncHandler(async (req, res) => {
  const { status, district, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (district) filter.district = district;
  if (search) {
    filter.$or = [
      { displayId: { $regex: search, $options: 'i' } },
      { originLabel: { $regex: search, $options: 'i' } },
      { destinationLabel: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [deliveries, total] = await Promise.all([
    Delivery.find(filter)
      .populate('driver', 'username')
      .populate('vehicle', 'name number')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Delivery.countDocuments(filter),
  ]);

  const stats = {
    active: await Delivery.countDocuments({ status: { $in: ['Assigned', 'In Progress', 'Delayed'] } }),
    deliveredToday: await Delivery.countDocuments({
      status: 'Completed',
      updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    completed: await Delivery.countDocuments({ status: 'Completed' }),
    scheduled: await Delivery.countDocuments({ status: 'Scheduled' }),
  };

  res.json({ deliveries, total, page: Number(page), limit: Number(limit), stats });
});

export const createDelivery = asyncHandler(async (req, res) => {
  const { originLabel, destinationLabel, district, driver, vehicle, etaMinutes, status, priority, cargoType } = req.body;
  if (!originLabel || !destinationLabel) {
    return res.status(400).json({ message: 'originLabel and destinationLabel are required.' });
  }
  const validStatuses = ['Scheduled', 'Assigned', 'In Progress', 'Delayed', 'Completed', 'Cancelled'];
  const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
  const count = await Delivery.countDocuments();
  const displayId = `#${8000 + count + 1}`;

  const delivery = await Delivery.create({
    displayId,
    originLabel,
    destinationLabel,
    district,
    driver,
    vehicle,
    etaMinutes,
    status: status && validStatuses.includes(status) ? status : undefined,
    priority: priority && validPriorities.includes(priority) ? priority : undefined,
    cargoType: cargoType || undefined,
  });
  broadcast('delivery:updated', { delivery });
  res.status(201).json({ delivery });
});

export const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status, etaMinutes } = req.body;
  const validStatuses = ['Scheduled', 'Assigned', 'In Progress', 'Delayed', 'Completed', 'Cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
  }
  const update = {};
  if (status) update.status = status;
  if (etaMinutes !== undefined) update.etaMinutes = etaMinutes;

  const delivery = await Delivery.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate('driver', 'username')
    .populate('vehicle', 'name number');
  if (!delivery) return res.status(404).json({ message: 'Delivery not found.' });
  broadcast('delivery:updated', { delivery });
  res.json({ delivery });
});

export const listDeliveryDistricts = asyncHandler(async (req, res) => {
  const districts = await Delivery.distinct('district');
  res.json({ districts: districts.filter(Boolean).sort() });
});
