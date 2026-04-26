/**
 * NEERVA Backend — Express Entry Point
 * Serves the Marine Intelligence Platform API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// ── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_ORIGIN || 'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8082',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join_role', (role) => {
    socket.join(role);
    console.log(`Client ${socket.id} joined role room: ${role}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_ORIGIN || 'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));  // Allow base64 images
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Database ──────────────────────────────────────────────────────────────────
const { connectDB } = require('./config/db');
connectDB();

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/boats', require('./routes/boats'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/sos-alerts', require('./routes/sosAlerts'));
app.use('/api/ocean-data', require('./routes/oceanData'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/risk', require('./routes/risk'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/fisheries', require('./routes/fisheries'));
app.use('/api/chat', require('./routes/chat'));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const { checkMLHealth } = require('./services/mlService');
    const mlStatus = await checkMLHealth();

    res.json({
      status: 'ok',
      service: 'NEERVA Backend',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      geminiEnabled: !!process.env.GEMINI_API_KEY,
      mlService: mlStatus
    });
  } catch (err) {
    res.json({
      status: 'ok',
      service: 'NEERVA Backend',
      mlService: { status: 'error', message: err.message }
    });
  }
});

app.get('/', (req, res) => {
  res.json({ service: 'NEERVA Marine Intelligence API', version: '2.0.0' });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🌊 NEERVA Backend running on http://localhost:${PORT}`);
  console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Enabled' : '❌ Not configured (set GEMINI_API_KEY)'}`);
  console.log(`   Frontend:  ${process.env.FRONTEND_ORIGIN || 'http://localhost:8080'}`);
  console.log(`   API Docs:  http://localhost:${PORT}/api/health\n`);
});

module.exports = { app, server, io };
