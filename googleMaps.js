import fetch from 'node-fetch';

const BASE = 'https://maps.googleapis.com/maps/api';

function requireKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || key === 'your_google_maps_api_key_here') {
    const err = new Error(
      'GOOGLE_MAPS_API_KEY is not configured on the server. See SETUP_GUIDE.md to create one.'
    );
    err.status = 503;
    throw err;
  }
  return key;
}

// Geocoding API: turn a place name into lat/lng.
export async function geocode(address) {
  const key = requireKey();
  const url = `${BASE}/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK') {
    const err = new Error(`Geocoding failed for "${address}": ${data.status}`);
    err.status = 502;
    throw err;
  }
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng, formattedAddress: data.results[0].formatted_address };
}

// Directions API: get up to `alternatives` route options between two points.
export async function getDirections({ origin, destination, alternatives = true, mode = 'driving' }) {
  const key = requireKey();
  const originParam = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
  const destParam = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
  const url =
    `${BASE}/directions/json?origin=${encodeURIComponent(originParam)}` +
    `&destination=${encodeURIComponent(destParam)}` +
    `&alternatives=${alternatives}&mode=${mode}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK') {
    const err = new Error(`Directions request failed: ${data.status} ${data.error_message || ''}`.trim());
    err.status = 502;
    throw err;
  }
  return data.routes.map((route, i) => {
    const leg = route.legs[0];
    return {
      label: `Route ${String.fromCharCode(65 + i)}`, // Route A, Route B...
      distanceKm: Math.round((leg.distance.value / 1000) * 10) / 10,
      durationMinutes: Math.round(leg.duration.value / 60),
      durationText: leg.duration.text,
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      polyline: route.overview_polyline?.points || '',
      steps: leg.steps.map((s) => s.html_instructions.replace(/<[^>]+>/g, '')),
    };
  });
}

export default { geocode, getDirections };
