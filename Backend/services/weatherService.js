const axios = require('axios');
const ZONES = require('../config/zones');
const OceanReading = require('../models/OceanReading');
const { classifyAlert } = require('./alertService');
const { predictZone } = require('./mlService');

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Fetch weather data from OpenWeatherMap for a single lat/lng.
 * Falls back to zone's base temperature if API key is missing or call fails.
 */
async function fetchWeatherForZone(zone) {
  if (!API_KEY || API_KEY === 'your_openweathermap_api_key_here') {
    return buildFallback(zone);
  }

  try {
    const url = `${BASE_URL}/weather?lat=${zone.lat}&lon=${zone.lng}&appid=${API_KEY}&units=metric`;
    const { data } = await axios.get(url, { timeout: 8000 });

    return {
      temperature: parseFloat(data.main.temp.toFixed(1)),
      feelsLike: parseFloat(data.main.feels_like.toFixed(1)),
      humidity: data.main.humidity,
      windSpeed: parseFloat((data.wind.speed * 3.6).toFixed(1)), // m/s → km/h
      windDirection: data.wind.deg || 0,
      weatherMain: data.weather[0].main,
      weatherDescription: data.weather[0].description,
      source: 'api',
    };
  } catch (err) {
    console.warn(`⚠️  OpenWeatherMap failed for ${zone.name}: ${err.message}. Using fallback.`);
    return buildFallback(zone);
  }
}

/**
 * Build realistic fallback weather data using zone's base temp
 * with small random variation to simulate live updates.
 */
function buildFallback(zone) {
  const month = new Date().getMonth() + 1;
  const isMonsoon = month >= 6 && month <= 9;
  const tempVariation = (Math.random() * 2 - 1).toFixed(1); // ±1°C
  const temperature = parseFloat((zone.baseTempC + parseFloat(tempVariation)).toFixed(1));
  const weatherMain = isMonsoon ? (Math.random() > 0.6 ? 'Rain' : 'Clouds') : 'Clear';

  return {
    temperature,
    feelsLike: temperature - 1,
    humidity: isMonsoon ? 80 + Math.floor(Math.random() * 15) : 65 + Math.floor(Math.random() * 15),
    windSpeed: isMonsoon ? 30 + Math.random() * 20 : 10 + Math.random() * 15,
    windDirection: Math.floor(Math.random() * 360),
    weatherMain,
    weatherDescription: weatherMain.toLowerCase(),
    source: 'fallback',
  };
}

/**
 * Refresh all zones: fetch weather, run ML prediction, store in MongoDB.
 */
async function refreshAllZones() {
  const month = new Date().getMonth() + 1;
  const results = [];

  for (const zone of ZONES) {
    try {
      const weather = await fetchWeatherForZone(zone);

      // Get ML prediction
      const ml = await predictZone({
        temperature: weather.temperature,
        lat: zone.lat,
        lng: zone.lng,
        month,
      });

      // Apply alert threshold logic on top of ML
      const riskLevel = classifyAlert({
        temperature: weather.temperature,
        weatherMain: weather.weatherMain,
        weatherDescription: weather.weatherDescription,
        windSpeed: weather.windSpeed,
        mlRiskLevel: ml.risk_level,
      });

      const reading = {
        zoneId: zone.id,
        zoneName: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
        humidity: weather.humidity,
        weatherMain: weather.weatherMain,
        weatherDescription: weather.weatherDescription,
        fishDensity: ml.fish_density,
        riskLevel,
        mlConfidenceFish: ml.confidence_fish || 0,
        mlConfidenceRisk: ml.confidence_risk || 0,
        source: weather.source,
        timestamp: new Date(),
      };

      // Persist to MongoDB (best-effort)
      try {
        await OceanReading.create(reading);
      } catch (dbErr) {
        // MongoDB not available — skip persistence
      }

      results.push(reading);
    } catch (err) {
      console.error(`Error refreshing zone ${zone.id}:`, err.message);
    }
  }

  return results;
}

module.exports = { fetchWeatherForZone, refreshAllZones };
