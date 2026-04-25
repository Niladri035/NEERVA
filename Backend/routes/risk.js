const express = require('express');
const router = express.Router();
const axios = require('axios');
const RiskLog = require('../models/RiskLog');
const Boat = require('../models/Boat');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/risk — Latest risk levels for all boats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let boats = [];
    try {
      boats = await Boat.find({ isActive: true }).select('boatId name lastLat lastLng currentRiskLevel lastSeen').lean();
    } catch (_) {}

    const summary = {
      danger: boats.filter(b => b.currentRiskLevel === 'DANGER').length,
      warning: boats.filter(b => b.currentRiskLevel === 'WARNING').length,
      safe: boats.filter(b => b.currentRiskLevel === 'SAFE').length,
      total: boats.length,
    };

    res.json({
      success: true,
      summary,
      boats,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/risk/assess — Get AI risk assessment for given conditions
// ─────────────────────────────────────────────────────────────────────────────
router.post('/assess', async (req, res) => {
  try {
    const { boatId, temperature, windSpeed, pressure, movement, lat, lng } = req.body;

    if (temperature == null) {
      return res.status(400).json({ error: 'temperature is required' });
    }

    // Call ML service
    let riskResult;
    try {
      const { data } = await axios.post(`${ML_URL}/predict-risk`, {
        temperature: temperature ?? 29,
        wind_speed: windSpeed ?? 20,
        pressure: pressure ?? 1010,
        movement: movement ?? 50,
      }, { timeout: 4000 });
      riskResult = data;
    } catch (_) {
      riskResult = ruleBasedRisk({ temperature, windSpeed, pressure });
      riskResult.source = 'rule-based';
    }

    // Save risk log
    if (boatId) {
      await RiskLog.create({
        boatId, temperature, windSpeed, pressure, movement,
        risk: riskResult.risk,
        confidence: riskResult.confidence,
      }).catch(() => {});

      // Update boat risk level
      await Boat.findOneAndUpdate(
        { boatId },
        { currentRiskLevel: riskResult.risk }
      ).catch(() => {});
    }

    res.json({
      success: true,
      risk: riskResult.risk,
      confidence: riskResult.confidence,
      source: riskResult.source || 'ml',
      recommendation: getRecommendation(riskResult.risk),
      inputs: { temperature, windSpeed, pressure, movement },
      assessedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/risk/history/:boatId — Risk history for a specific boat
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history/:boatId', async (req, res) => {
  try {
    const logs = await RiskLog.find({ boatId: req.params.boatId })
      .sort({ createdAt: -1 })
      .limit(48) // last 48 readings
      .lean();
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function ruleBasedRisk({ temperature, windSpeed, pressure }) {
  if (temperature > 33 || windSpeed > 60 || pressure < 995) {
    return { risk: 'DANGER', confidence: 0.9 };
  }
  if (temperature > 31 || windSpeed > 40 || pressure < 1005) {
    return { risk: 'WARNING', confidence: 0.75 };
  }
  return { risk: 'SAFE', confidence: 0.85 };
}

function getRecommendation(risk) {
  return {
    SAFE: 'Conditions are safe. Proceed with normal fishing operations.',
    WARNING: 'Conditions are deteriorating. Stay alert and monitor weather closely. Prepare to return to shore.',
    DANGER: 'DANGER conditions detected. Immediately return to shore or seek shelter. Activate SOS if needed.',
  }[risk] || 'Monitor conditions carefully.';
}

module.exports = router;
