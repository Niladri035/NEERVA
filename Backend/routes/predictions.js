const express = require('express');
const router = express.Router();
const ZONES = require('../config/zones');
const OceanReading = require('../models/OceanReading');
const { predictZone, getTemperatureTrend } = require('../services/mlService');

/**
 * GET /api/predictions
 * Returns ML-predicted future state for all zones.
 * Query: ?mode=current|predicted (default: predicted)
 *        ?days=7 (for temperature trend)
 */
router.get('/', async (req, res) => {
  try {
    const mode = req.query.mode || 'predicted';
    const days = parseInt(req.query.days) || 7;
    const month = new Date().getMonth() + 1;

    // Get current readings to base predictions on
    let currentReadings = [];
    try {
      currentReadings = await OceanReading.latestForAllZones();
    } catch (_) {}

    const readingMap = {};
    currentReadings.forEach(r => { readingMap[r.zoneId] = r; });

    const predictions = await Promise.all(
      ZONES.map(async (zone) => {
        const current = readingMap[zone.id];
        const baseTemp = current ? current.temperature : zone.baseTempC;

        // For 'predicted' mode: simulate +1-2 days ahead temperature shift
        const predictedTemp = mode === 'predicted'
          ? parseFloat((baseTemp + 0.4 + Math.random() * 0.6).toFixed(1))
          : baseTemp;

        const ml = await predictZone({
          temperature: predictedTemp,
          lat: zone.lat,
          lng: zone.lng,
          month,
        });

        return {
          id: zone.id,
          name: zone.name,
          lat: zone.lat,
          lng: zone.lng,
          mode,
          currentTemperature: baseTemp,
          predictedTemperature: predictedTemp,
          fishDensity: ml.fish_density,
          riskLevel: ml.risk_level,
          confidenceFish: ml.confidence_fish,
          confidenceRisk: ml.confidence_risk,
          predictionSource: ml.source || 'ml',
        };
      })
    );

    // Temperature trend for all zones
    const trends = await Promise.all(
      ZONES.map(async (zone) => {
        const trend = await getTemperatureTrend(zone.id, days);
        return { zoneId: zone.id, zoneName: zone.name, ...trend };
      })
    );

    res.json({
      success: true,
      mode,
      forecastDays: days,
      data: predictions,
      temperatureTrends: trends,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/predictions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/predictions/custom
 * Predict for arbitrary input (for testing / scientist use).
 */
router.post('/custom', async (req, res) => {
  try {
    const { temperature, lat, lng, month } = req.body;
    if (!temperature || !lat || !lng) {
      return res.status(400).json({ error: 'temperature, lat, lng are required' });
    }
    const result = await predictZone({
      temperature,
      lat,
      lng,
      month: month || new Date().getMonth() + 1,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
