const express = require('express');
const router = express.Router();
const Boat = require('../models/Boat');
const { generateToken, requireUserJWT, requireRole } = require('../middleware/auth');
const { hashDeviceKey } = require('../services/encryptionService');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/boats — List all active boats with last positions (CoastGuard/Admin Only)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireUserJWT, requireRole(['coastguard', 'admin']), async (req, res) => {
  try {
    let boats = [];
    try {
      boats = await Boat.find({ isActive: true })
        .select('-deviceKeyHash') // never expose hashed key
        .sort({ lastSeen: -1 })
        .lean();
    } catch (_) {
      boats = getDemoBoats();
    }
    if (boats.length === 0) boats = getDemoBoats();

    res.json({ success: true, count: boats.length, data: boats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/boats/register — Register a new boat device
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, ownerName, contact, registrationNumber, homePort, crewCapacity, deviceKey } = req.body;

    if (!name || !ownerName || !contact || !deviceKey) {
      return res.status(400).json({ error: 'name, ownerName, contact, deviceKey are required' });
    }

    // Check duplicate registration
    const existing = await Boat.findOne({ contact, name }).catch(() => null);
    if (existing) {
      return res.status(409).json({ error: 'Boat already registered', boatId: existing.boatId });
    }

    const boat = await Boat.register(
      { name, ownerName, contact, registrationNumber, homePort, crewCapacity },
      deviceKey
    );

    // Return JWT so device can authenticate future requests
    const token = generateToken(boat);

    console.log(`✅ Boat registered: ${boat.boatId} — ${name}`);

    res.status(201).json({
      success: true,
      message: 'Boat registered successfully',
      boatId: boat.boatId,
      token, // Device stores this for future API calls
      note: 'Keep your deviceKey secret. It is used to encrypt SOS transmissions.',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/boats/auth — Authenticate and get JWT token
// ─────────────────────────────────────────────────────────────────────────────
router.post('/auth', async (req, res) => {
  try {
    const { boatId, deviceKey } = req.body;
    if (!boatId || !deviceKey) {
      return res.status(400).json({ error: 'boatId and deviceKey required' });
    }

    const boat = await Boat.findOne({ boatId, isActive: true });
    if (!boat) return res.status(403).json({ error: 'Unknown boat' });

    const hashedKey = hashDeviceKey(deviceKey);
    if (hashedKey !== boat.deviceKeyHash) {
      return res.status(403).json({ error: 'Invalid deviceKey' });
    }

    const token = generateToken(boat);
    await Boat.findOneAndUpdate({ boatId }, { lastSeen: new Date() });

    res.json({ success: true, token, boatId, name: boat.name });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/boats/heartbeat — Update boat position + activity
// ─────────────────────────────────────────────────────────────────────────────
router.post('/heartbeat', async (req, res) => {
  try {
    const { boatId, lat, lng, movement, battery } = req.body;
    if (!boatId) return res.status(400).json({ error: 'boatId required' });

    await Boat.findOneAndUpdate(
      { boatId },
      {
        lastLat: lat,
        lastLng: lng,
        lastSeen: new Date(),
        lastPositionAt: new Date(),
      }
    ).catch(() => {});

    res.json({ success: true, message: 'Heartbeat received' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Demo boats for when DB is empty
// ─────────────────────────────────────────────────────────────────────────────
function getDemoBoats() {
  return [
    { boatId: 'BOAT-DEMO-01', name: 'Sea Explorer', ownerName: 'Ravi Kumar', contact: '+91 98765 43210', lastLat: 19.2, lastLng: 72.8, currentRiskLevel: 'SAFE', homePort: 'Mumbai' },
    { boatId: 'BOAT-DEMO-02', name: 'Ocean Pride', ownerName: 'Suresh Nair', contact: '+91 98765 43211', lastLat: 18.5, lastLng: 70.2, currentRiskLevel: 'WARNING', homePort: 'Kochi' },
    { boatId: 'BOAT-DEMO-03', name: 'Marine Star', ownerName: 'Ajay Patel', contact: '+91 98765 43212', lastLat: 16.8, lastLng: 73.1, currentRiskLevel: 'SAFE', homePort: 'Goa' },
    { boatId: 'BOAT-DEMO-04', name: 'Blue Horizon', ownerName: 'Mohan Das', contact: '+91 98765 43213', lastLat: 20.1, lastLng: 69.5, currentRiskLevel: 'DANGER', homePort: 'Surat' },
    { boatId: 'BOAT-DEMO-05', name: 'Deep Fisher', ownerName: 'Krishnan M', contact: '+91 98765 43214', lastLat: 12.5, lastLng: 79.0, currentRiskLevel: 'SAFE', homePort: 'Chennai' },
  ];
}

module.exports = router;
