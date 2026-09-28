import { getWeather, getNaturalEvents, getRecentEarthquakes } from '../utils/disasterData.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// GET /api/weather/current?lat=..&lon=..
export const currentWeather = asyncHandler(async (req, res) => {
  const { lat = 27.48, lon = 95.35 } = req.query; // defaults to Sector-4-style NE India fallback
  const data = await getWeather(lat, lon);
  res.json(data);
});

// GET /api/weather/disaster-feed — combined natural-event + earthquake overlay
// for the Northeast India corridor, useful for auto-flagging Roads/Alerts.
export const disasterFeed = asyncHandler(async (req, res) => {
  const [events, earthquakes] = await Promise.all([
    getNaturalEvents({ days: 20 }).catch(() => []),
    getRecentEarthquakes({ minMagnitude: 4, days: 7 }).catch(() => []),
  ]);
  res.json({ naturalEvents: events, earthquakes });
});
