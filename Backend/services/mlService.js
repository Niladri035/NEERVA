const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Predict fish density and risk level for a single zone.
 * Falls back to rule-based prediction if ML service is unavailable.
 */
async function predictZone({ temperature, lat, lng, month }) {
  try {
    const { data } = await axios.post(
      `${ML_URL}/predict/zone`,
      { temperature, lat, lng, month },
      { timeout: 5000 }
    );
    return data;
  } catch (err) {
    console.warn(`⚠️  ML service unavailable: ${err.message}. Using rule-based fallback.`);
    return ruleBasedPredict({ temperature, lat, lng, month });
  }
}

/**
 * Get temperature trend predictions for a zone.
 */
async function getTemperatureTrend(zoneId, days = 7) {
  try {
    const { data } = await axios.get(`${ML_URL}/predict/temperature-trend`, {
      params: { zone_id: zoneId, days },
      timeout: 5000,
    });
    return data;
  } catch (err) {
    console.warn(`⚠️  ML trend service unavailable: ${err.message}. Using linear fallback.`);
    return linearTrendFallback(zoneId, days);
  }
}

/**
 * Rule-based fish density + risk prediction fallback.
 * Uses the same logic domain knowledge from the ML model training data.
 */
function ruleBasedPredict({ temperature, lat, lng, month }) {
  // Temperature-based fish density
  let fish_density;
  if (temperature < 27) {
    fish_density = 'High'; // cooler upwelling zones have more fish
  } else if (temperature < 30) {
    fish_density = 'Medium';
  } else {
    fish_density = 'Low'; // too warm
  }

  // Seasonal boost for south Indian ocean (monsoon upwelling)
  const monsoonMonths = [6, 7, 8, 9];
  if (monsoonMonths.includes(month) && lat < 15 && lng < 78) {
    fish_density = fish_density === 'Low' ? 'Medium' : 'High';
  }

  // Risk level based on temperature
  let risk_level;
  if (temperature >= 31.5) {
    risk_level = 'Danger';
  } else if (temperature >= 29.5) {
    risk_level = 'Warning';
  } else {
    risk_level = 'Safe';
  }

  return {
    fish_density,
    risk_level,
    confidence_fish: 0.72,
    confidence_risk: 0.68,
    source: 'rule-based-fallback',
  };
}

/**
 * Linear temperature trend fallback when ML service is down.
 */
function linearTrendFallback(zoneId, days) {
  const baseTemp = 28.5;
  const trend = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    trend.push({
      date: date.toISOString().split('T')[0],
      predicted_temp: parseFloat((baseTemp + i * 0.08 + (Math.random() * 0.4 - 0.2)).toFixed(2)),
    });
  }
  return { zone_id: zoneId, trend, source: 'linear-fallback' };
}

/**
 * Check health status of ML service.
 */
async function checkMLHealth() {
  try {
    const { data } = await axios.get(`${ML_URL}/health`, { timeout: 5000 });
    return data;
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

module.exports = { predictZone, getTemperatureTrend, checkMLHealth };
