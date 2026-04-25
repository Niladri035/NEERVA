/**
 * Alert classification service.
 * Applies business rules on top of raw weather data and ML predictions
 * to produce a final riskLevel: 'Safe' | 'Warning' | 'Danger'
 */

const TEMP_WARNING_THRESHOLD = 31.0; // °C
const TEMP_DANGER_THRESHOLD = 33.0;  // °C
const WIND_WARNING_THRESHOLD = 40;   // km/h
const WIND_DANGER_THRESHOLD = 65;    // km/h

const DANGER_WEATHER = ['Thunderstorm', 'Squall', 'Tornado', 'Hurricane'];
const WARNING_WEATHER = ['Rain', 'Drizzle', 'Fog', 'Mist'];

const DANGER_KEYWORDS = ['cyclone', 'storm', 'hurricane', 'tornado', 'squall', 'gale'];
const WARNING_KEYWORDS = ['shower', 'heavy rain', 'rough', 'thundery'];

/**
 * @param {Object} params
 * @param {number} params.temperature  - SST in °C
 * @param {string} params.weatherMain  - OWM weather main category
 * @param {string} params.weatherDescription - OWM description
 * @param {number} params.windSpeed    - km/h
 * @param {string} params.mlRiskLevel  - ML model prediction
 * @returns {'Safe'|'Warning'|'Danger'}
 */
function classifyAlert({ temperature, weatherMain, weatherDescription, windSpeed, mlRiskLevel }) {
  const desc = (weatherDescription || '').toLowerCase();
  const main = weatherMain || '';

  // Hard rules — always override ML
  if (
    DANGER_WEATHER.includes(main) ||
    DANGER_KEYWORDS.some(k => desc.includes(k)) ||
    temperature >= TEMP_DANGER_THRESHOLD ||
    windSpeed >= WIND_DANGER_THRESHOLD
  ) {
    return 'Danger';
  }

  if (
    WARNING_WEATHER.includes(main) ||
    WARNING_KEYWORDS.some(k => desc.includes(k)) ||
    temperature >= TEMP_WARNING_THRESHOLD ||
    windSpeed >= WIND_WARNING_THRESHOLD
  ) {
    return 'Warning';
  }

  // If rules say Safe but ML says Warning/Danger — trust ML
  if (mlRiskLevel === 'Danger') return 'Warning'; // downgrade ML Danger if no weather evidence
  if (mlRiskLevel === 'Warning') return 'Warning';

  return 'Safe';
}

/**
 * Convert a zone reading into a disaster alert object
 * (same shape as OceanMap.tsx's disasters array).
 */
function buildDisasterAlert(zone) {
  if (zone.riskLevel === 'Safe') return null;

  const typeMap = {
    Thunderstorm: 'Cyclone',
    Rain: 'High Waves',
    Squall: 'Cyclone',
  };

  const type = typeMap[zone.weatherMain] || 
    (zone.temperature >= TEMP_WARNING_THRESHOLD ? 'Temperature Anomaly' : 'High Waves');

  const severity = zone.riskLevel === 'Danger' ? 'High' : 'Medium';

  return {
    id: zone.zoneId,
    type,
    severity,
    location: zone.zoneName,
    coordinates: `${zone.lat.toFixed(1)}°N, ${zone.lng.toFixed(1)}°E`,
    time: 'just now',
    description: buildDescription(zone, type),
    affectedVessels: estimateAffectedVessels(zone),
    riskLevel: zone.riskLevel,
    temperature: zone.temperature,
    windSpeed: zone.windSpeed,
  };
}

function buildDescription(zone, type) {
  if (type === 'Cyclone') {
    return `Severe weather system detected. Wind speeds ${zone.windSpeed.toFixed(0)} km/h. Avoid the area.`;
  }
  if (type === 'Temperature Anomaly') {
    return `Sea surface temperature anomaly at ${zone.temperature}°C — ${(zone.temperature - 28).toFixed(1)}°C above seasonal average.`;
  }
  return `Wave heights and rough conditions. Wind speed ${zone.windSpeed.toFixed(0)} km/h. Hazardous for small vessels.`;
}

function estimateAffectedVessels(zone) {
  // Rough estimate based on wind speed and zone size
  return Math.floor(zone.windSpeed / 3) + Math.floor(Math.random() * 10);
}

module.exports = { classifyAlert, buildDisasterAlert };
