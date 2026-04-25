const express = require('express');
const router = express.Router();
const SOSAlert = require('../models/SOSAlert');

// In-memory fallback for when MongoDB is unavailable
let inMemoryAlerts = [
  {
    id: 'SOS001',
    fishermanName: 'Ravi Kumar',
    boatName: 'Sea Explorer',
    location: '19.2°N, 72.8°E',
    distance: '12 nautical miles',
    time: '15 minutes ago',
    emergency: 'Engine Failure',
    priority: 'High',
    status: 'Active',
    contact: '+91 98765 43210',
    crewSize: 4,
    description: 'Engine has completely failed. Boat is drifting. Need immediate assistance.',
    createdAt: new Date(Date.now() - 15 * 60000),
  },
  {
    id: 'SOS002',
    fishermanName: 'Suresh Nair',
    boatName: 'Ocean Pride',
    location: '18.5°N, 70.2°E',
    distance: '25 nautical miles',
    time: '1 hour ago',
    emergency: 'Medical Emergency',
    priority: 'Critical',
    status: 'Coast Guard Dispatched',
    contact: '+91 98765 43211',
    crewSize: 3,
    description: 'Crew member injured during fishing operations. Requires medical evacuation.',
    createdAt: new Date(Date.now() - 60 * 60000),
  },
];

/**
 * GET /api/sos-alerts
 * Returns all SOS alerts, sorted newest first.
 */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    let alerts = [];
    try {
      alerts = await SOSAlert.find(query).sort({ createdAt: -1 }).lean();
    } catch (_) {
      alerts = inMemoryAlerts;
    }

    // Enrich with time-ago string
    const enriched = alerts.map(a => ({
      ...a,
      id: a._id?.toString() || a.id,
      time: getTimeAgo(a.createdAt),
      distance: a.distance || estimateDistance(a.lat, a.lng),
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    console.error('GET /api/sos-alerts error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/sos-alerts
 * Create a new SOS alert from the frontend form.
 */
router.post('/', async (req, res) => {
  try {
    const { fishermanName, boatName, contact, latitude, longitude, crewSize, emergency } = req.body;

    if (!fishermanName || !boatName || !contact || !emergency) {
      return res.status(400).json({
        success: false,
        error: 'fishermanName, boatName, contact, emergency are required',
      });
    }

    const lat = parseFloat(latitude) || null;
    const lng = parseFloat(longitude) || null;
    const location = lat && lng
      ? `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`
      : 'Location not provided';

    // Determine priority based on emergency type
    const priority = determinePriority(emergency);

    const alertData = {
      fishermanName,
      boatName,
      contact,
      lat,
      lng,
      location,
      crewSize: parseInt(crewSize) || 1,
      emergency,
      description: req.body.description || '',
      priority,
      status: 'Active',
    };

    let saved;
    try {
      saved = await SOSAlert.create(alertData);
    } catch (_) {
      // MongoDB unavailable — save in-memory
      saved = { ...alertData, id: `SOS${Date.now()}`, createdAt: new Date() };
      inMemoryAlerts.unshift(saved);
    }

    console.log(`🆘 New SOS Alert: ${fishermanName} — ${emergency} at ${location}`);

    res.status(201).json({
      success: true,
      message: 'SOS Alert created. Coast Guard and rescue teams notified.',
      data: saved,
    });
  } catch (err) {
    console.error('POST /api/sos-alerts error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/sos-alerts/:id/status
 * Update the status of an SOS alert (dispatch, resolve).
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Active', 'Coast Guard Dispatched', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    let updated;
    try {
      updated = await SOSAlert.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
    } catch (_) {
      const idx = inMemoryAlerts.findIndex(a => a.id === req.params.id);
      if (idx > -1) {
        inMemoryAlerts[idx].status = status;
        updated = inMemoryAlerts[idx];
      }
    }

    if (!updated) return res.status(404).json({ error: 'Alert not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTimeAgo(date) {
  if (!date) return 'unknown time';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
}

function estimateDistance(lat, lng) {
  // Rough coastal distance estimate for Indian western coast
  if (!lat || !lng) return 'Unknown distance';
  const coastLng = 72.8; // approx Mumbai coast
  const diff = Math.abs(lng - coastLng) * 111;
  return `${Math.floor(diff)} nautical miles`;
}

function determinePriority(emergency) {
  const critical = ['medical', 'fire', 'sinking', 'capsized'];
  const high = ['engine', 'collision', 'flooding'];
  const lower = emergency.toLowerCase();
  if (critical.some(k => lower.includes(k))) return 'Critical';
  if (high.some(k => lower.includes(k))) return 'High';
  return 'Medium';
}

module.exports = router;
