/**
 * Nearby Alert Service
 * Finds boats within a radius (km) and broadcasts SOS alerts to them.
 * Uses Haversine formula for accurate distance calculation.
 */

const Boat = require('../models/Boat');

/**
 * Calculate distance between two GPS points using Haversine formula.
 * Returns distance in kilometers.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * (Math.PI / 180); }

/**
 * Find all active boats within radiusKm of the given position,
 * excluding the boat that sent the SOS.
 */
async function findNearbyBoats(lat, lng, radiusKm = 50, excludeBoatId = null) {
  let boats = [];
  try {
    boats = await Boat.find({ isActive: true, lastLat: { $ne: null } }).lean();
  } catch (_) {
    return [];
  }

  return boats
    .filter(b => b.boatId !== excludeBoatId && b.lastLat && b.lastLng)
    .map(b => ({
      boatId: b.boatId,
      name: b.name,
      contact: b.contact,
      lat: b.lastLat,
      lng: b.lastLng,
      distanceKm: haversineKm(lat, lng, b.lastLat, b.lastLng),
    }))
    .filter(b => b.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Broadcast an SOS alert to nearby boats.
 * In production: push via WebSocket / LoRa packet / SMS.
 * Here: simulation log + return list.
 */
async function broadcastToNearby(sosEvent, radiusKm = 50) {
  const { lat, lng } = sosEvent.location || {};
  if (!lat || !lng) return { notified: 0, boats: [] };

  const nearbyBoats = await findNearbyBoats(lat, lng, radiusKm, sosEvent.boatId);

  nearbyBoats.forEach(b => {
    console.log(
      `📢 [Nearby] Alert sent to boat ${b.boatId} (${b.name}) — ` +
      `${b.distanceKm.toFixed(1)} km away`
    );
    // Production: dispatch push notification or LoRa message here
  });

  return { notified: nearbyBoats.length, boats: nearbyBoats };
}

module.exports = { findNearbyBoats, broadcastToNearby, haversineKm };
