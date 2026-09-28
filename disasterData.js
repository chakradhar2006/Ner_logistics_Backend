import fetch from 'node-fetch';

// All of these are free, public data sources. None require an API key,
// which makes them a good complement to the paid Google Maps Platform calls.
// See SETUP_GUIDE.md for a longer description of each one.

// 1. Open-Meteo — current + 5-day forecast (already used by the frontend).
export async function getWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw Object.assign(new Error('Open-Meteo request failed'), { status: 502 });
  return res.json();
}

// 2. NASA EONET — active natural events worldwide (floods, storms, wildfires, landslides...).
// Docs: https://eonet.gsfc.nasa.gov/docs/v3
// Scoped to a Northeast-India-ish bounding box by default — EONET has no
// server-side geographic filter, so events are fetched globally and then
// filtered client-side (here) by their geometry.
export async function getNaturalEvents({ days = 20, status = 'open', bbox } = {}) {
  const url = `https://eonet.gsfc.nasa.gov/api/v3/events?status=${status}&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw Object.assign(new Error('NASA EONET request failed'), { status: 502 });
  const data = await res.json();
  const box = bbox || { minLat: 18, maxLat: 32, minLon: 85, maxLon: 100 }; // Northeast India + surrounding region

  const inBox = (geometry) => {
    if (!geometry) return false;
    const coords = geometry.coordinates;
    // EONET geometry is either a single [lon, lat] point or a [ [lon,lat], ... ] polygon/track.
    const points = Array.isArray(coords[0]) ? coords : [coords];
    return points.some(([lon, lat]) => lat >= box.minLat && lat <= box.maxLat && lon >= box.minLon && lon <= box.maxLon);
  };

  return (data.events || [])
    .map((e) => ({
      id: e.id,
      title: e.title,
      categories: e.categories.map((c) => c.title),
      link: e.link,
      geometry: e.geometry?.[e.geometry.length - 1] || null,
    }))
    .filter((e) => inBox(e.geometry));
}

// 3. USGS Earthquake feed — the northeast India / Himalayan belt is seismically
// active, so this is directly relevant for road-risk overlays.
// Docs: https://earthquake.usgs.gov/fdsnws/event/1/
export async function getRecentEarthquakes({ minMagnitude = 4, days = 7, bbox } = {}) {
  const endTime = new Date().toISOString();
  const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  let url =
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
    `&starttime=${startTime}&endtime=${endTime}&minmagnitude=${minMagnitude}`;
  // Default bounding box roughly covers Northeast India (Assam, Meghalaya, Manipur, etc.)
  const box = bbox || { minLat: 21, maxLat: 29.5, minLon: 89, maxLon: 97.5 };
  url += `&minlatitude=${box.minLat}&maxlatitude=${box.maxLat}&minlongitude=${box.minLon}&maxlongitude=${box.maxLon}`;
  const res = await fetch(url);
  if (!res.ok) throw Object.assign(new Error('USGS earthquake feed failed'), { status: 502 });
  const data = await res.json();
  return (data.features || []).map((f) => ({
    id: f.id,
    magnitude: f.properties.mag,
    place: f.properties.place,
    time: new Date(f.properties.time).toISOString(),
    coordinates: { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] },
    url: f.properties.url,
  }));
}

export default { getWeather, getNaturalEvents, getRecentEarthquakes };
