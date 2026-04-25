const mongoose = require('mongoose');

const oceanReadingSchema = new mongoose.Schema(
  {
    zoneId: { type: String, required: true, index: true },
    zoneName: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    temperature: { type: Number, required: true },
    windSpeed: { type: Number, default: 0 },
    windDirection: { type: Number, default: 0 },
    humidity: { type: Number, default: 0 },
    weatherMain: { type: String, default: 'Clear' },
    weatherDescription: { type: String, default: 'clear sky' },
    fishDensity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    riskLevel: {
      type: String,
      enum: ['Safe', 'Warning', 'Danger'],
      default: 'Safe',
    },
    mlConfidenceFish: { type: Number, default: 0 },
    mlConfidenceRisk: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ['api', 'fallback', 'manual'],
      default: 'api',
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Always fetch the latest reading for a zone
oceanReadingSchema.statics.latestForZone = function (zoneId) {
  return this.findOne({ zoneId }).sort({ timestamp: -1 });
};

// Fetch the latest reading for all zones
oceanReadingSchema.statics.latestForAllZones = async function () {
  return this.aggregate([
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$zoneId',
        doc: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$doc' } },
  ]);
};

module.exports = mongoose.model('OceanReading', oceanReadingSchema);
