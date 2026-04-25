const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neerva';

async function connectDB() {
  let retries = 5;
  while (retries > 0) {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB connected: ${MONGODB_URI}`);
      return;
    } catch (err) {
      retries -= 1;
      console.warn(`⚠️  MongoDB connection failed. Retries left: ${retries}. Error: ${err.message}`);
      if (retries === 0) {
        console.error('❌ MongoDB unavailable — running without persistence. All data will be served from in-memory fallbacks.');
      } else {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }
}

module.exports = { connectDB };
