import * as googleMaps from '../utils/googleMaps.js';
import * as openRouteService from '../utils/openRouteService.js';
import { assessCorridorRisk } from '../utils/riskEngine.js';
import RouteOptimization from '../models/RouteOptimization.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// MAP_PROVIDER=ors (default, free, no billing) or MAP_PROVIDER=google (paid, richer data).
// See SETUP_GUIDE.md for how to get keys for either.
function getMapProvider() {
  const provider = (process.env.MAP_PROVIDER || 'ors').toLowerCase();
  return provider === 'google' ? googleMaps : openRouteService;
}

// POST /api/routes/optimize  { origin, destination, districtHints? }
// origin/destination can be free-text place names or { lat, lng }.
export const optimizeRoute = asyncHandler(async (req, res) => {
  const { origin, destination, districtHints = [] } = req.body;
  if (!origin || !destination) {
    return res.status(400).json({ message: 'origin and destination are required.' });
  }

  const provider = getMapProvider();
  const originPoint = typeof origin === 'string' ? await provider.geocode(origin) : origin;
  const destPoint = typeof destination === 'string' ? await provider.geocode(destination) : destination;

  const [rawRoutes, corridorRisk] = await Promise.all([
    provider.getDirections({ origin: originPoint, destination: destPoint, alternatives: true }),
    assessCorridorRisk({ districtHints }),
  ]);

  // Distribute the corridor risk across route options: the first (shortest
  // distance) route is treated as more exposed if any high-risk reasons
  // exist, mirroring the "avoids the landslide" logic in the reference UI.
  const options = rawRoutes.map((r, i) => {
    const applyRisk = i === 0 && corridorRisk.level !== 'Low';
    return {
      label: r.label,
      distanceKm: r.distanceKm,
      durationMinutes: r.durationMinutes,
      durationText: r.durationText,
      polyline: r.polyline,
      riskLevel: applyRisk ? corridorRisk.level : 'Low',
      riskReasons: applyRisk ? corridorRisk.reasons : [],
      recommended: false,
    };
  });

  // Recommend the lowest-risk option; break ties by shortest duration.
  const ranked = [...options].sort((a, b) => {
    const order = { Low: 0, Medium: 1, High: 2 };
    if (order[a.riskLevel] !== order[b.riskLevel]) return order[a.riskLevel] - order[b.riskLevel];
    return a.durationMinutes - b.durationMinutes;
  });
  if (ranked[0]) ranked[0].recommended = true;

  const saved = await RouteOptimization.create({
    requestedBy: req.user?._id,
    originLabel: typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`,
    destinationLabel: typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`,
    origin: originPoint,
    destination: destPoint,
    options,
  });

  res.json({ routeOptimization: saved, corridorRisk });
});

export const listRouteHistory = asyncHandler(async (req, res) => {
  const routes = await RouteOptimization.find({ requestedBy: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({ routes });
});
