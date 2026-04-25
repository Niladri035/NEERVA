const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireUserJWT } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'neerva-jwt-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// --- IN-MEMORY FALLBACK DATABASE ---
const inMemoryUsers = [];
// -----------------------------------

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // --- DEMO BYPASSES ---
  const demoUsers = {
    'admin': { role: 'admin', name: 'System Administrator', pass: 'admin123' },
    'coastguard': { role: 'coastguard', name: 'Coast Guard Commander', pass: 'coast123' },
    'scientist': { role: 'scientist', name: 'Marine Biologist', pass: 'science123' },
  };

  if (demoUsers[username] && password === demoUsers[username].pass) {
    const payload = {
      id: `demo-${username}-id`,
      username,
      role: demoUsers[username].role,
      name: demoUsers[username].name
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY }, (err, token) => {
      if (err) throw err;
      return res.json({ token, user: payload });
    });
  }
  // ---------------------

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { id: user._id, username: user.username, role: user.role, name: user.name };
    jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY }, (err, token) => {
      if (err) return res.status(500).json({ error: 'Token generation failed' });
      res.json({ token, user: payload });
    });
  } catch (err) {
    // --- MONGODB OFFLINE FALLBACK ---
    const memUser = inMemoryUsers.find(u => u.username === username);
    if (memUser && memUser.password === password) {
      const payload = { id: memUser.id, username: memUser.username, role: memUser.role, name: memUser.name };
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY }, (err, token) => {
        if (err) return res.status(500).json({ error: 'Token generation failed' });
        res.json({ token, user: payload });
      });
    }
    // If not in memory, mimic standard 401 so frontend can auto-register
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user (Fisherman or Scientist only)
router.post('/register', async (req, res) => {
  const { name, username, password, role } = req.body;

  try {
    if (!name || !username || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Security: Do not allow open registration of admins
    if (role === 'admin') {
      return res.status(403).json({ error: 'Admin registration is restricted. Contact system administrator.' });
    }

    if (!['fisherman', 'scientist', 'coastguard'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    const newUser = await User.create({ name, username, password, role });
    const payload = { id: newUser._id, username: newUser.username, role: newUser.role, name: newUser.name };

    jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY }, (err, token) => {
      if (err) return res.status(500).json({ error: 'Token generation failed' });
      res.status(201).json({ token, user: payload });
    });
  } catch (err) {
    // --- MONGODB OFFLINE FALLBACK ---
    const memExists = inMemoryUsers.find(u => u.username === username);
    if (memExists) return res.status(400).json({ error: 'Username already exists' });

    const newUser = { id: `mem-${Date.now()}`, name, username, password, role };
    inMemoryUsers.push(newUser);

    const payload = { id: newUser.id, username: newUser.username, role: newUser.role, name: newUser.name };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY }, (err, token) => {
      if (err) return res.status(500).json({ error: 'Token generation failed' });
      res.status(201).json({ token, user: payload });
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user details
// @access  Private
router.get('/me', requireUserJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
