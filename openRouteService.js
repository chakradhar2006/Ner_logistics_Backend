import fetch from 'node-fetch';

// OpenRouteService (https://openrouteservice.org) is a free, open routing
// engine built on OpenStreetMap data. The free tier needs only an email
// signup (no credit card). Exact daily quota is shown on your own account
// dashboard (account.heigit.org/info/plans) and has changed over time —
// check there rather than trusting a hardcoded number here.
// This file mirrors the shape of utils/googleMaps.js so routeOptController.js
// can switch providers with a single env var (MAP_PROVIDER=ors|google).
//
// IMPORTANT — domain migration (April 2026): HeiGIT (who run
// OpenRouteService) is unifying all their APIs under api.heigit.org and
// deprecated api.openrouteservice.org, with a full shut-off announced for
// August 24, 2026. These base URLs already point at the new domain per
// their official mapping: https://ask.openrouteservice.org/t/7912
//   api.openrouteservice.org/v2/directions -> api.heigit.org/openrouteservice/v2/directions
//   api.openrouteservice.org/geocode/search -> api.heigit.org/pelias/v1/search
// Your existing API key works on the new domain without any changes.

const GEOCODE_BASE = 'https://api.heigit.org/pelias/v1/search';
const DIRECTIONS_BASE = 'https://api.heigit.org/openrouteservice/v2/directions/driving-car';

function requireKey() {
  const key = process.env.ORS_API_KEY;
  if (!key || key === 'your_openrouteservice_api_key_here') {
    const err = new Error(
      'ORS_API_KEY is not configured on the server. See SETUP_GUIDE.md — it is free and takes 2 minutes to get.'
    );
    err.status = 503;
    throw err;
  }
  return key;
}

export async function geocode(address) {
  const key = requireKey();
  const url = `${GEOCODE_BASE}?api_key=${key}&text=${encodeURIComponent(address)}&size=1`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Surface what ORS actually said instead of masking auth/rate-limit
    // errors as a generic "no results" — those look identical otherwise
    // because both responses lack a `features` array.
    const detail = data.error?.message || data.error || res.statusText;
    const isQuotaIssue = /quota|rate limit|too many requests/i.test(String(detail));
    let message = `OpenRouteService geocoding request failed (${res.status}): ${detail}`;
    if (isQuotaIssue) {
      message = `OpenRouteService daily quota or rate limit exceeded (${res.status}: ${detail}). Your API key is fine — this just means you've used up today's free-tier requests. Check your usage and reset time at openrouteservice.org/dev, or wait and try again (quotas typically reset at midnight UTC).`;
    } else if (res.status === 401 || res.status === 403) {
      message = `OpenRouteService rejected the request (${res.status}: ${detail}). Check that ORS_API_KEY in .env is correct and that you've verified your account email at openrouteservice.org.`;
    } else if (res.status === 429) {
      message = `OpenRouteService rate limit or daily quota exceeded (429: ${detail}). Check your current usage and reset time at openrouteservice.org/dev, or try again after the reset (typically midnight UTC).`;
    }
    const err = new Error(message);
    err.status = 502;
    throw err;
  }

  const feature = data.features?.[0];
  if (!feature) {
    const err = new Error(`Geocoding failed for "${address}": no results. Try a more specific or differently-spelled place name.`);
    err.status = 502;
    throw err;
  }
  const [lng, lat] = feature.geometry.coordinates;
  return { lat, lng, formattedAddress: feature.properties.label };
}

// ORS returns one best route per call; we call it twice (default + a
// preference for shortest distance) to approximate Google's "alternatives".
export async function getDirections({ origin, destination }) {
  const key = requireKey();
  const toCoord = (p) => (typeof p === 'string' ? p : `${p.lng},${p.lat}`);

  async function fetchRoute(preference) {
    const res = await fetch(DIRECTIONS_BASE, {
      method: 'POST',
      headers: { Authorization: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [toCoord(origin).split(',').map(Number), toCoord(destination).split(',').map(Number)],
        preference,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.routes?.length) {
      const detail = data.error?.message || data.error || res.statusText || 'no routes returned';
      const isQuotaIssue = /quota|rate limit|too many requests/i.test(String(detail));
      const message = isQuotaIssue
        ? `OpenRouteService daily quota or rate limit exceeded (${res.status}: ${detail}). Your API key is fine — check usage/reset time at openrouteservice.org/dev.`
        : `OpenRouteService directions request failed (${res.status}): ${detail}`;
      const err = new Error(message);
      err.status = 502;
      throw err;
    }
    const route = data.routes[0];
    return {
      distanceKm: Math.round((route.summary.distance / 1000) * 10) / 10,
      durationMinutes: Math.round(route.summary.duration / 60),
      durationText: `${Math.round(route.summary.duration / 60)} min`,
      polyline: route.geometry, // encoded polyline (ORS uses Google's polyline algorithm too)
      steps: (route.segments?.[0]?.steps || []).map((s) => s.instruction),
    };
  }

  const [fastest, shortest] = await Promise.all([
    fetchRoute('fastest'),
    fetchRoute('shortest').catch(() => null),
  ]);

  const routes = [{ label: 'Route A', ...fastest }];
  if (shortest && shortest.distanceKm !== fastest.distanceKm) {
    routes.push({ label: 'Route B', ...shortest });
  }
  return routes;
}

export default { geocode, getDirections };
