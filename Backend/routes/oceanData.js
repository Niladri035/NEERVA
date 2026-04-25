const express = require('express');
const router = express.Router();
const OceanReading = require('../models/OceanReading');
const ZONES = require('../config/zones');
const { refreshAllZones } = require('../services/weatherService');
const { requireUserJWT, requireRole } = require('../middleware/auth');

// In-memory cache for when MongoDB is unavailable
let inMemoryCache = [];

/**
 * GET /api/ocean-data
 * Returns normalized zone data for all 7 Indian Ocean zones. (All Users)
 */
router.get('/', requireUserJWT, async (req, res) => {
  try {
    // Try MongoDB first
    let readings = [];
    try {
      readings = await OceanReading.latestForAllZones();
    } catch (dbErr) {
      readings = inMemoryCache;
    }

    // If no data at all, do a live refresh
    if (!readings || readings.length === 0) {
      const fresh = await refreshAllZones();
      inMemoryCache = fresh;
      readings = fresh;
    }

    // Normalize to frontend zone shape — guarantee all 7 zones present
    const zoneMap = {};
    readings.forEach(r => { zoneMap[r.zoneId] = r; });

    const normalized = ZONES.map(zone => {
      const r = zoneMap[zone.id];
      if (!r) {
        // Zone missing — return base data
        return {
          id: zone.id,
          name: zone.name,
          temperature: zone.baseTempC,
          fishDensity: 'Medium',
          riskLevel: 'Safe',
          lat: zone.lat,
          lng: zone.lng,
          windSpeed: 0,
          humidity: 70,
          weatherMain: 'Clear',
          weatherDescription: 'clear sky',
          lastUpdated: new Date().toISOString(),
          source: 'fallback',
        };
      }
      return {
        id: r.zoneId,
        name: r.zoneName,
        temperature: r.temperature,
        fishDensity: r.fishDensity,
        riskLevel: r.riskLevel,
        lat: r.lat,
        lng: r.lng,
        windSpeed: r.windSpeed,
        humidity: r.humidity,
        weatherMain: r.weatherMain,
        weatherDescription: r.weatherDescription,
        mlConfidenceFish: r.mlConfidenceFish,
        mlConfidenceRisk: r.mlConfidenceRisk,
        lastUpdated: (r.timestamp || r.createdAt || new Date()).toISOString(),
        source: r.source,
      };
    });

    res.json({
      success: true,
      count: normalized.length,
      data: normalized,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/ocean-data error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ocean-data/history/:zoneId
 * Returns historical readings for a zone (last 30 entries).
 */
router.get('/history/:zoneId', async (req, res) => {
  try {
    const readings = await OceanReading.find({ zoneId: req.params.zoneId })
      .sort({ timestamp: -1 })
      .limit(30)
      .lean();

    res.json({ success: true, count: readings.length, data: readings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ocean-data/refresh
 * Manually trigger a data refresh (Admin Only)
 */
router.post('/refresh', requireUserJWT, requireRole(['admin']), async (req, res) => {
  try {
    const fresh = await refreshAllZones();
    inMemoryCache = fresh;
    res.json({ success: true, message: 'Data refreshed', count: fresh.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
module.exports.setInMemoryCache = (data) => { inMemoryCache = data; };
