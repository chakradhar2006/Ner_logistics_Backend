import Report from '../models/Report.js';
import Vehicle from '../models/Vehicle.js';
import Delivery from '../models/Delivery.js';
import Incident from '../models/Incident.js';
import Road from '../models/Road.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const listReports = asyncHandler(async (req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 });
  res.json({ reports });
});

// POST /api/reports/generate  { cadence: 'DAILY'|'WEEKLY'|'MONTHLY'|'FIELD', title }
// Builds a small JSON snapshot report from live collections — swap this for a
// PDF/CSV export job (e.g. with a queue) once you need downloadable files.
export const generateReport = asyncHandler(async (req, res) => {
  const { cadence = 'DAILY', title } = req.body;

  const report = await Report.create({
    title: title || `${cadence.charAt(0)}${cadence.slice(1).toLowerCase()} Report`,
    cadence,
    status: 'Generating',
    requestedBy: req.user._id,
  });

  const [vehicleCount, activeDeliveries, incidentLog, blockedRoads] = await Promise.all([
    Vehicle.countDocuments(),
    Delivery.countDocuments({ status: { $in: ['Assigned', 'In Progress', 'Delayed'] } }),
    Incident.find().sort({ createdAt: -1 }).limit(50).lean(),
    Road.countDocuments({ status: 'Blocked' }),
  ]);

  report.status = 'Ready';
  report.generatedAt = new Date();
  report.description = `Snapshot: ${vehicleCount} vehicles, ${activeDeliveries} active deliveries, ${blockedRoads} blocked roads, ${incidentLog.length} recent incidents.`;
  await report.save();

  res.status(201).json({ report, snapshot: { vehicleCount, activeDeliveries, blockedRoads, incidentLog } });
});
