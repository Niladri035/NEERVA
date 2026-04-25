/**
 * POST /api/sos
 * The core SOS endpoint — handles:
 *   1. Device authentication
 *   2. Optional AES-256 encrypted payload
 *   3. AI risk validation
 *   4. Multi-layer communication dispatch
 *   5. Nearby boat notification
 *   6. Offline queue fallback
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const SOSEvent = require('../models/SOSEvent');
const RiskLog = require('../models/RiskLog');
const Boat = require('../models/Boat');
const { requireDeviceAuth, rateLimit, requireUserJWT, requireRole } = require('../middleware/auth');
const { decrypt } = require('../services/encryptionService');
const { dispatchSOS } = require('../services/communicationService');
const { broadcastToNearby } = require('../services/nearbyAlertService');
const { enqueue } = require('../utils/offlineQueue');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sos — Create SOS event
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireDeviceAuth, rateLimit, async (req, res) => {
  try {
    let payload = req.body;

    // --- Step 1: Decrypt if payload is encrypted ---
    if (payload.encrypted && payload.data) {
      try {
        const boat = await Boat.findOne({ boatId: req.boat.boatId });
        // Derive the raw key (frontend must provide it as a header or use JWT)
        const deviceKey = req.headers['x-device-key'] || payload.boatId;
        payload = decrypt(payload.data, deviceKey);
        payload._wasEncrypted = true;
      } catch (decErr) {
        return res.status(400).json({ error: 'Decryption failed. Check deviceKey.', detail: decErr.message });
      }
    }

    // --- Step 2: Validate required fields ---
    const { boatId, emergency, lat, lng, triggerType = 'manual', crewSize = 1 } = payload;
    if (!boatId || !emergency) {
      return res.status(400).json({ error: 'boatId and emergency are required' });
    }

    // --- Step 3: Get AI risk assessment ---
    let riskData = { risk: 'UNKNOWN', confidence: 0 };
    const { temperature, windSpeed, pressure, movement } = payload;
    if (temperature != null) {
      try {
        const { data } = await axios.post(`${ML_URL}/predict-risk`, {
          temperature: temperature ?? 29,
          wind_speed: windSpeed ?? 20,
          pressure: pressure ?? 1010,
          movement: movement ?? 50,
        }, { timeout: 3000 });
        riskData = data;
      } catch (_) {
        // AI service offline — use rule-based fallback
        riskData = ruleBasedRisk({ temperature, windSpeed, pressure });
      }
    }

    // --- Step 4: Determine priority ---
    const priority = riskData.risk === 'DANGER' ? 'Critical'
      : riskData.risk === 'WARNING' ? 'High'
        : triggerType === 'auto-no-movement' ? 'Critical'
          : 'High';

    // --- Step 5: Build and save SOS event ---
    const locationStr = lat && lng
      ? `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`
      : 'Unknown';

    let savedEvent;
    try {
      savedEvent = await SOSEvent.create({
        boatId,
        fishermanName: payload.fishermanName,
        boatName: payload.boatName,
        contact: payload.contact,
        triggerType,
        location: { lat: parseFloat(lat) || null, lng: parseFloat(lng) || null, locationStr },
        emergency,
        description: payload.description || '',
        priority,
        crewSize: parseInt(crewSize) || 1,
        riskSnapshot: {
          risk: riskData.risk,
          confidence: riskData.confidence,
          temperature, windSpeed, pressure,
        },
        wasEncrypted: !!payload._wasEncrypted,
      });
    } catch (dbErr) {
      console.warn('⚠️  MongoDB save failed — proceeding with comms anyway');
    }

    // --- Step 6: Log risk ---
    try {
      await RiskLog.create({
        boatId,
        temperature, windSpeed, pressure, movement,
        risk: riskData.risk,
        confidence: riskData.confidence,
        autoSOSTriggerred: triggerType !== 'manual' && triggerType !== 'voice',
        alertSent: true,
      });
    } catch (_) { }

    // --- Step 7: Dispatch via communication layers ---
    let commResult;
    try {
      commResult = await dispatchSOS(
        { boatId, location: { lat, lng }, emergency, priority },
        payload.networkStatus
      );
      if (savedEvent) {
        savedEvent.communicationLayer = commResult.layer;
        savedEvent.communicationResult = commResult;
        await savedEvent.save().catch(() => { });
      }
    } catch (_) {
      // Queue for retry
      enqueue({ boatId, location: { lat, lng }, emergency, priority });
      commResult = { success: false, layer: 'queued' };
    }

    // --- Step 8: Notify nearby boats ---
    let nearbyResult = { notified: 0, boats: [] };
    if (lat && lng) {
      nearbyResult = await broadcastToNearby(
        { boatId, location: { lat, lng }, emergency, priority }
      );
      if (savedEvent) {
        savedEvent.nearbyBoatsNotified = nearbyResult.notified;
        await savedEvent.save().catch(() => { });
      }
    }

    // --- Step 9: Update boat's last position (Auto-create if missing) ---
    if (lat && lng) {
      const boatUpdate = {
        lastLat: lat,
        lastLng: lng,
        lastSeen: new Date(),
        lastPositionAt: new Date(),
        currentRiskLevel: riskData.risk || 'SAFE'
      };

      try {
        const boat = await Boat.findOneAndUpdate(
          { boatId },
          boatUpdate,
          { new: true, upsert: true } // UPSERT: Create if not exists
        );
        if (boat && !boat.fishermanName && payload.fishermanName) {
          boat.fishermanName = payload.fishermanName;
          await boat.save().catch(() => { });
        }
      } catch (upsertErr) {
        console.warn(`⚠️  Boat upsert failed for ${boatId}:`, upsertErr.message);
      }
    }

    console.log(`🆘 SOS DISPATCHED [${priority}] | Boat: ${boatId} | Type: ${emergency} | Risk: ${riskData.risk}`);

    // --- Step 10: Emit to coastguard room ---
    const io = req.app.get('io');
    if (io) {
      io.to('coastguard').emit('new_sos_alert', {
        boatId,
        emergency,
        lat,
        lng,
        fishermanName: payload.fishermanName,
        location: { lat, lng, locationStr },
        eventId: savedEvent?.eventId || `SOS-${Date.now()}`,
        priority
      });
    }

    res.status(201).json({
      success: true,
      message: 'SOS alert dispatched. Help is on the way.',
      eventId: savedEvent?.eventId || `SOS-${Date.now()}`,
      priority,
      riskAssessment: riskData,
      communicationLayer: commResult?.layer || 'queued',
      nearbyBoatsNotified: nearbyResult.notified,
      nearbyBoats: nearbyResult.boats.slice(0, 5),
    });

  } catch (err) {
    console.error('POST /api/sos error:', err);
    // Last resort — enqueue
    enqueue(req.body || {});
    res.status(500).json({
      success: false,
      error: err.message,
      note: 'Alert queued for retry when connection is restored.',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sos — List all SOS events (CoastGuard/Admin Only)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireUserJWT, requireRole(['coastguard', 'admin']), async (req, res) => {
  try {
    const { status, boatId, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (boatId) query.boatId = boatId;

    let events = [];
    try {
      events = await SOSEvent.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();
    } catch (_) {
      events = [];
    }

    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/sos/:eventId/status — Update SOS status (CoastGuard/Admin Only)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:eventId/status', requireUserJWT, requireRole(['coastguard', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Active', 'Coast Guard Dispatched', 'Resolved', 'False Alarm'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const update = { status };
    if (status === 'Resolved') update.resolvedAt = new Date();

    const event = await SOSEvent.findOneAndUpdate(
      { eventId: req.params.eventId },
      update,
      { new: true }
    );

    if (!event) return res.status(404).json({ error: 'SOS event not found' });

    // Emit status update to specific boat and coastguard
    const io = req.app.get('io');
    if (io) {
      io.to('coastguard').emit('sos_status_updated', { eventId: event.eventId, status: event.status });
      // If dispatched, notify the boat specifically
      if (status === 'Coast Guard Dispatched') {
        io.emit('rescue_status', { boatId: event.boatId, status: 'Coast Guard Dispatched', message: 'Rescue unit has been dispatched to your location!' });
      }
    }

    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function ruleBasedRisk({ temperature, windSpeed, pressure }) {
  if ((temperature > 33) || (windSpeed > 60) || (pressure < 995)) {
    return { risk: 'DANGER', confidence: 0.9 };
  }
  if ((temperature > 31) || (windSpeed > 40) || (pressure < 1005)) {
    return { risk: 'WARNING', confidence: 0.75 };
  }
  return { risk: 'SAFE', confidence: 0.85 };
}

module.exports = router;
