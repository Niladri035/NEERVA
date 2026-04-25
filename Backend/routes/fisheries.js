const express = require('express');
const router = express.Router();
const OceanReading = require('../models/OceanReading');
const { requireUserJWT, requireRole } = require('../middleware/auth');

/**
 * GET /api/fisheries
 * Returns fisheries dashboard data (Fisherman/Scientist/Admin Only)
 */
router.get('/', requireUserJWT, requireRole(['fisherman', 'scientist', 'admin']), async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    // Monthly fishing volume — seasonal pattern based on Indian ocean conditions
    const monthlyFishingData = generateMonthlyData();

    // Species distribution
    const fishSpeciesData = [
      { name: 'Tuna', value: 35 },
      { name: 'Sardine', value: 25 },
      { name: 'Mackerel', value: 20 },
      { name: 'Pomfret', value: 12 },
      { name: 'Others', value: 8 },
    ];

    let fishingZones = [];
    if (lat && lng) {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);
      
      // Real-time generated zones near user coordinates
      fishingZones = [
        { id: 1, type: 'High', pos: [uLat + 0.03, uLng + 0.02], radius: 2000, color: '#0d9488', label: 'Prime: Tuna/Mackerel Cluster', confidence: 0.94 },
        { id: 2, type: 'High', pos: [uLat - 0.02, uLng - 0.05], radius: 1800, color: '#0d9488', label: 'Prime: Pomfret Hotspot', confidence: 0.89 },
        { id: 3, type: 'Medium', pos: [uLat + 0.06, uLng - 0.03], radius: 3000, color: '#f59e0b', label: 'Steady: Mixed Species', confidence: 0.76 },
        { id: 4, type: 'Medium', pos: [uLat - 0.04, uLng + 0.06], radius: 2500, color: '#f59e0b', label: 'Steady: Shrimps/Prawns', confidence: 0.82 },
        { id: 5, type: 'Low', pos: [uLat + 0.08, uLng + 0.05], radius: 4000, color: '#3b82f6', label: 'Sparse: Deep Water', confidence: 0.98 },
        { id: 6, type: 'Low', pos: [uLat - 0.07, uLng - 0.04], radius: 3500, color: '#3b82f6', label: 'Sparse: High Salinity', confidence: 0.91 }
      ];
    } else {
      fishingZones = [
        { id: 1, type: 'High', pos: [19.0, 72.8], radius: 2500, color: '#0d9488', label: 'Default: Area A1', confidence: 0.85 },
        { id: 2, type: 'Medium', pos: [15.4, 73.8], radius: 3000, color: '#f59e0b', label: 'Default: Area B2', confidence: 0.75 },
      ];
    }

    res.json({
      success: true,
      data: {
        monthlyFishingData,
        fishSpeciesData,
        fishingZones,
        stats: {
          totalCatch: '2,450 tons',
          activeVessels: 1247,
          highDensityZones: 7,
          seasonalPeak: getSeasonalPeak(),
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('GET /api/fisheries error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

function generateMonthlyData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  // Seasonal fishing pattern for Indian Ocean (peak Oct-Mar)
  const baseValues = [2800, 2200, 3200, 2600, 1800, 1400, 1200, 1600, 2000, 2800, 3400, 3000];

  return months.slice(0, Math.min(currentMonth + 1, 6)).map((name, i) => ({
    name,
    value: baseValues[i] + Math.floor((Math.random() - 0.5) * 400),
  }));
}

function getSeasonalPeak() {
  const month = new Date().getMonth();
  if (month >= 9 || month <= 2) return 'October–March';
  return 'Post-Monsoon (Oct)';
}

module.exports = router;
