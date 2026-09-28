import fetch from 'node-fetch';
import Vehicle from '../models/Vehicle.js';
import { assessCorridorRisk } from '../utils/riskEngine.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Finds the best currently-active vehicle/driver pair. This is a simple
// stand-in for real dispatch logic (nearest-driver, load-matching, etc.) —
// swap in real geolocation distance once vehicles report live coordinates.
async function findBestDriver() {
  const vehicle = await Vehicle.findOne({ status: 'Active' }).populate('owner', 'username mobile');
  return vehicle;
}

function ruleBasedReply(userText, context) {
  const text = userText.toLowerCase();
  const { vehicle, corridorRisk } = context;
  const driverName = vehicle?.owner?.username || 'the next available driver';
  const vehicleDesc = vehicle ? `${vehicle.name} (${vehicle.number})` : 'an available vehicle';

  if (text.includes('2 vehicle') || text.includes('two vehicle') || text.includes('different direction')) {
    return `Got it — two vehicles, two directions. I compared both legs: current corridor risk is **${corridorRisk.level}**. I'm assigning the strongest available driver to the higher-risk leg first so it isn't left running late, and a nearby driver will cover the other leg right after.`;
  }
  if (text.includes('confirm')) {
    return `Booking confirmed. Your driver is **${driverName}** (${vehicleDesc}). Their contact number will be shared with you now that the trip is booked${vehicle?.owner?.mobile ? ': ' + vehicle.owner.mobile : '.'}`;
  }
  if (text.includes('safe') || text.includes('safety') || text.includes('risk')) {
    return `Safety comes first. I cross-check every route against submitted incident reports and live map data. Current corridor risk is **${corridorRisk.level}**${corridorRisk.reasons.length ? ': ' + corridorRisk.reasons[0] : '.'}`;
  }
  if (text.includes('driver') || text.includes('vehicle')) {
    return `Based on availability, I'd recommend **${driverName}** driving a ${vehicleDesc} — it's the best match for this load right now.`;
  }
  if (text.includes('hi') || text.includes('hello') || text.includes('hey')) {
    return "Hey! Just tell me your pickup and drop location and I'll get you matched with the best driver.";
  }
  if (text.includes('to') || text.includes('→')) {
    const riskNote = corridorRisk.reasons[0] ? ` avoiding ${corridorRisk.reasons[0].split(':')[0]}` : '';
    return `Searching nearby drivers and plotting the safest path...\n\nBest match: **${driverName}** · ${vehicleDesc}${riskNote}. Want me to confirm this booking?`;
  }
  return 'I can help you find the best driver and vehicle, plan routes around active incidents, or handle multiple orders heading in different directions. Try telling me a pickup and drop location.';
}

async function claudeReply(userText, context) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const systemPrompt = `You are Velocity AI, a dispatch assistant for a Northeast-India logistics company. ` +
    `Current best available vehicle: ${context.vehicle ? `${context.vehicle.name} (${context.vehicle.number}), driver ${context.vehicle.owner?.username}` : 'none available'}. ` +
    `Current corridor risk: ${context.corridorRisk.level}. Known risk reasons: ${context.corridorRisk.reasons.join('; ') || 'none'}. ` +
    `Reply in 2-4 short sentences, be concrete and reassuring, and offer to confirm a booking when relevant.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userText }],
    }),
  });
  const data = await res.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  return textBlock?.text || ruleBasedReply(userText, context);
}

// POST /api/velocity/chat  { message }
export const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'message is required.' });
  }

  const [vehicle, corridorRisk] = await Promise.all([findBestDriver(), assessCorridorRisk()]);
  const context = { vehicle, corridorRisk };

  let reply;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      reply = await claudeReply(message, context);
    } catch (err) {
      reply = ruleBasedReply(message, context);
    }
  } else {
    reply = ruleBasedReply(message, context);
  }

  res.json({ reply, context: { corridorRisk } });
});
