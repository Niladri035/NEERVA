const express = require('express');
const router = express.Router();
const OceanReading = require('../models/OceanReading');
const { buildDisasterAlert } = require('../services/alertService');
const ZONES = require('../config/zones');

/**
 * GET /api/alerts
 * Returns active weather alerts derived from latest ocean readings.
 * Matches the disasters[] shape used in OceanMap.tsx.
 */
router.get('/', async (req, res) => {
  try {
    let readings = [];
    try {
      readings = await OceanReading.latestForAllZones();
    } catch (_) {}

    // Build alerts only for zones with Warning or Danger
    const alerts = readings
      .filter(r => r.riskLevel !== 'Safe')
      .map(r => buildDisasterAlert(r))
      .filter(Boolean);

    // If no real alerts, return demo alerts so UI always has something
    const response = alerts.length > 0 ? alerts : getDemoAlerts();

    res.json({
      success: true,
      count: response.length,
      data: response,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/alerts error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/alerts/summary
 * Summary statistics for the alert dashboard.
 */
router.get('/summary', async (req, res) => {
  try {
    let readings = [];
    try {
      readings = await OceanReading.latestForAllZones();
    } catch (_) {}

    const danger = readings.filter(r => r.riskLevel === 'Danger').length;
    const warning = readings.filter(r => r.riskLevel === 'Warning').length;
    const safe = readings.filter(r => r.riskLevel === 'Safe').length;

    res.json({
      success: true,
      data: {
        danger,
        warning,
        safe,
        total: readings.length,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function getDemoAlerts() {
  return [
    {
      id: 'demo-1',
      type: 'Cyclone',
      severity: 'High',
      location: 'Bay of Bengal',
      coordinates: '16.5°N, 82.3°E',
      time: '2 hours ago',
      description: 'Tropical cyclone forming with wind speeds up to 120 km/h',
      affectedVessels: 45,
      riskLevel: 'Danger',
      temperature: 30.2,
      windSpeed: 120,
    },
    {
      id: 'demo-2',
      type: 'High Waves',
      severity: 'Medium',
      location: 'Arabian Sea Central',
      coordinates: '18.0°N, 70.1°E',
      time: '4 hours ago',
      description: 'Wave heights reaching 4-6 meters, hazardous for small vessels',
      affectedVessels: 23,
      riskLevel: 'Warning',
      temperature: 31.5,
      windSpeed: 55,
    },
    {
      id: 'demo-3',
      type: 'Temperature Anomaly',
      severity: 'Low',
      location: 'Lakshadweep Sea',
      coordinates: '12.3°N, 71.7°E',
      time: '6 hours ago',
      description: 'Unusual temperature rise detected, monitoring marine life impact',
      affectedVessels: 8,
      riskLevel: 'Warning',
      temperature: 32.1,
      windSpeed: 18,
    },
  ];
}

module.exports = router;
