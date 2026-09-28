import Road from '../models/Road.js';
import Incident from '../models/Incident.js';

/**
 * Very small, explainable risk model. It does NOT try to be a real geospatial
 * routing risk engine — it's a starting point you can extend:
 *  - Every road flagged "Blocked" contributes a hard block reason.
 *  - Every "Risky" road contributes a medium risk reason.
 *  - Any open incident with severity High/Critical within the last 24h adds risk.
 * Extend this by adding real polyline/geofence intersection against Google's
 * route `polyline` once you have production road-geometry data.
 */
export async function assessCorridorRisk({ districtHints = [] } = {}) {
  const roadQuery = districtHints.length ? { district: { $in: districtHints } } : {};
  const [roads, incidents] = await Promise.all([
    Road.find(roadQuery).lean(),
    Incident.find({
      status: { $ne: 'Resolved' },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const reasons = [];
  let score = 0; // 0 = low, higher = riskier

  for (const road of roads) {
    if (road.status === 'Blocked') {
      score += 40;
      reasons.push(`${road.name}: blocked${road.riskReason ? ' — ' + road.riskReason : ''}`);
    } else if (road.status === 'Risky') {
      score += 15;
      reasons.push(`${road.name}: risky${road.riskReason ? ' — ' + road.riskReason : ''}`);
    }
  }

  for (const incident of incidents) {
    if (incident.severity === 'Critical') score += 25;
    else if (incident.severity === 'High') score += 12;
    else if (incident.severity === 'Medium') score += 5;
    if (incident.severity === 'High' || incident.severity === 'Critical') {
      reasons.push(`${incident.type} reported (${incident.severity}) near ${incident.locationLabel || 'field location'}`);
    }
  }

  let level = 'Low';
  if (score >= 40) level = 'High';
  else if (score >= 15) level = 'Medium';

  return { score, level, reasons: reasons.slice(0, 6) };
}

export default { assessCorridorRisk };
