import Incident from '../models/Incident.js';
import Road from '../models/Road.js';
import Alert from '../models/Alert.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { broadcast } from '../utils/sseHub.js';

export const listIncidents = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);

  const [incidents, total] = await Promise.all([
    Incident.find(filter)
      .populate('reportedBy', 'username role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Incident.countDocuments(filter),
  ]);
  res.json({ incidents, total, page: Number(page), limit: Number(limit) });
});

// GET /api/incidents/:id — used by the "click an alert -> see the incident" modal.
export const getIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id)
    .populate('reportedBy', 'username role mobile')
    .populate('road', 'name district status');
  if (!incident) return res.status(404).json({ message: 'Incident not found.' });
  res.json({ incident });
});

// POST /api/incidents  (multipart/form-data: photo)
export const createIncident = asyncHandler(async (req, res) => {
  const { type, severity, description, locationLabel, lat, lng, roadId } = req.body;
  if (!type) return res.status(400).json({ message: 'Incident type is required.' });

  const incident = await Incident.create({
    reportedBy: req.user._id,
    type,
    severity: severity || 'Medium',
    description,
    locationLabel,
    coordinates: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
    photoUrl: req.file ? `/uploads/${req.file.filename}` : '',
    road: roadId || null,
  });

  broadcast('incident:new', { incident });

  // Cascade: a High/Critical incident automatically raises a dashboard alert,
  // and — if linked to a known road — nudges that road's status.
  if (['High', 'Critical'].includes(incident.severity)) {
    const alert = await Alert.create({
      tag: incident.severity === 'Critical' ? 'CRITICAL' : 'HIGH RISK',
      title: `${incident.type} reported${incident.locationLabel ? ' near ' + incident.locationLabel : ''}`,
      description: incident.description || `Field report submitted by ${req.user.username}.`,
      source: 'incident',
      relatedIncident: incident._id,
      relatedRoad: incident.road || null,
    });
    broadcast('alert:new', { alert });

    if (incident.road) {
      const road = await Road.findByIdAndUpdate(
        incident.road,
        {
          status: incident.severity === 'Critical' ? 'Blocked' : 'Risky',
          riskReason: incident.type,
          lastUpdatedAt: new Date(),
        },
        { new: true }
      );
      broadcast('road:updated', { road });
    }
  }

  res.status(201).json({ incident });
});

export const updateIncidentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const incident = await Incident.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!incident) return res.status(404).json({ message: 'Incident not found.' });
  res.json({ incident });
});
