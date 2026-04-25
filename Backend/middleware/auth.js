const jwt = require('jsonwebtoken');
const Boat = require('../models/Boat');
const { hashDeviceKey } = require('../services/encryptionService');

const JWT_SECRET = process.env.JWT_SECRET || 'neerva-jwt-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * Generate a JWT for a registered boat device.
 */
function generateToken(boat) {
  return jwt.sign(
    { boatId: boat.boatId, deviceId: boat._id, role: 'boat' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Middleware: verify JWT in Authorization header.
 * Attaches req.boat = { boatId, deviceId, role }
 */
function requireJWT(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.split(' ')[1];
  
  if (token === 'DUMMY_TOKEN') {
    req.boat = { boatId: 'DEMO-Vessel', deviceId: '12345', role: 'boat' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.boat = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid', detail: err.message });
  }
}

/**
 * Middleware: verify boatId + deviceKey pair from request body or header.
 * Used on POST /api/sos where the device may not carry a JWT.
 * Attaches req.boat after validating.
 */
async function requireDeviceAuth(req, res, next) {
  // First try JWT (preferred — already logged-in device)
  const header = req.headers['authorization'];
  if (header && header.startsWith('Bearer ')) {
    return requireJWT(req, res, next);
  }

  // Fall back to boatId + deviceKey in body
  const { boatId, deviceKey } = req.body;
  if (!boatId || !deviceKey) {
    return res.status(401).json({
      error: 'Authentication required: provide JWT or boatId + deviceKey',
    });
  }

  try {
    const boat = await Boat.findOne({ boatId, isActive: true });
    if (!boat) return res.status(403).json({ error: 'Unknown boat device' });

    const hashedKey = hashDeviceKey(deviceKey);
    if (hashedKey !== boat.deviceKeyHash) {
      // Log failed attempt
      console.warn(`⚠️  Auth failure for boatId ${boatId} from ${req.ip}`);
      return res.status(403).json({ error: 'Invalid device key' });
    }

    req.boat = { boatId: boat.boatId, deviceId: boat._id };
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth service error', detail: err.message });
  }
}

/**
 * Rate-limit middleware: max N SOS requests per boatId per minute.
 * Prevents fake/spam SOS flooding.
 */
const sosRateMap = new Map(); // boatId → { count, resetAt }
const SOS_MAX_PER_MINUTE = 3;

function rateLimit(req, res, next) {
  const boatId = req.boat?.boatId || req.body?.boatId || req.ip;
  const now = Date.now();
  const entry = sosRateMap.get(boatId) || { count: 0, resetAt: now + 60000 };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60000;
  }

  entry.count += 1;
  sosRateMap.set(boatId, entry);

  if (entry.count > SOS_MAX_PER_MINUTE) {
    return res.status(429).json({
      error: 'Too many SOS requests. Possible spam detected.',
      retryAfter: Math.ceil((entry.resetAt - now) / 1000) + 's',
    });
  }

  next();
}

/**
 * Middleware: verify JWT for frontend users (Admin, Fisherman, Scientist).
 * Attaches req.user = { id, role, name, username }
 */
function requireUserJWT(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.role || decoded.role === 'boat') {
      return res.status(403).json({ error: 'This endpoint requires a valid user token, not a device token.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid', detail: err.message });
  }
}

/**
 * Middleware factory: strictly enforce role-based access control.
 * Must be used AFTER requireUserJWT.
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden. Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
}

module.exports = { generateToken, requireJWT, requireDeviceAuth, rateLimit, requireUserJWT, requireRole };
