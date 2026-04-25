const express = require('express');
const router = express.Router();
const OceanReading = require('../models/OceanReading');
const ZONES = require('../config/zones');

/**
 * GET /api/recommendations
 * Returns top fishing zones for fishermen:
 *   - riskLevel === 'Safe'
 *   - fishDensity === 'High' or 'Medium'
 * Sorted by fishDensity desc, then temperature (cooler = better upwelling).
 */
router.get('/', async (req, res) => {
  try {
    let readings = [];
    try {
      readings = await OceanReading.latestForAllZones();
    } catch (_) {}

    // Build a zone map
    const readingMap = {};
    readings.forEach(r => { readingMap[r.zoneId] = r; });

    const month = new Date().getMonth() + 1;

    // Score each zone
    const scored = ZONES.map(zone => {
      const r = readingMap[zone.id];
      const fishDensity = r ? r.fishDensity : 'Medium';
      const riskLevel = r ? r.riskLevel : 'Safe';
      const temperature = r ? r.temperature : zone.baseTempC;
      const windSpeed = r ? r.windSpeed : 10;

      // Scoring: safe + high density = best
      const densityScore = { High: 3, Medium: 2, Low: 1 }[fishDensity] || 1;
      const riskScore = { Safe: 3, Warning: 1, Danger: 0 }[riskLevel] || 0;
      const tempScore = temperature < 28 ? 2 : temperature < 30 ? 1 : 0;
      const seasonScore = zone.seasonalPeak?.includes(month) ? 1 : 0;
      const totalScore = densityScore * 2 + riskScore * 3 + tempScore + seasonScore;

      return {
        id: zone.id,
        name: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        temperature,
        fishDensity,
        riskLevel,
        windSpeed,
        score: totalScore,
        isRecommended: riskLevel === 'Safe' && fishDensity !== 'Low',
        reason: buildReason(fishDensity, riskLevel, temperature, zone.seasonalPeak?.includes(month)),
        bestTimeToFish: getBestTime(month, zone),
      };
    });

    // Sort by score desc, filter recommended
    const recommended = scored
      .filter(z => z.isRecommended)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5

    const allZones = scored.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      count: recommended.length,
      data: {
        topRecommendations: recommended,
        allZonesRanked: allZones,
        generatedAt: new Date().toISOString(),
        advisory: buildAdvisory(recommended),
      },
    });
  } catch (err) {
    console.error('GET /api/recommendations error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

function buildReason(fishDensity, riskLevel, temperature, inSeason) {
  const reasons = [];
  if (fishDensity === 'High') reasons.push('High fish density detected');
  if (fishDensity === 'Medium') reasons.push('Moderate fish activity');
  if (riskLevel === 'Safe') reasons.push('Safe weather conditions');
  if (temperature < 28) reasons.push('Optimal upwelling temperature');
  if (inSeason) reasons.push('Peak seasonal activity');
  return reasons.join(' · ') || 'Moderate conditions';
}

function getBestTime(month, zone) {
  const peakMonths = zone.seasonalPeak || [];
  if (peakMonths.includes(month)) return 'Now (Peak Season)';
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const peakStr = peakMonths.map(m => monthNames[m]).join(', ');
  return `Peak season: ${peakStr}`;
}

function buildAdvisory(recommended) {
  if (recommended.length === 0) return 'No safe zones with high fish density currently. Please wait for conditions to improve.';
  const topZone = recommended[0];
  return `Best zone: ${topZone.name} — ${topZone.reason}. Temperature: ${topZone.temperature}°C.`;
}

module.exports = router;
