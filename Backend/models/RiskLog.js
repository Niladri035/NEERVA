const mongoose = require('mongoose');

const riskLogSchema = new mongoose.Schema(
  {
    boatId: { type: String, required: true, index: true },
    zoneId: { type: String },

    // Input features
    temperature: { type: Number },
    windSpeed: { type: Number },
    pressure: { type: Number },
    waveHeight: { type: Number },
    movement: { type: Number }, // 0-100 activity score

    // AI output
    risk: {
      type: String,
      enum: ['SAFE', 'WARNING', 'DANGER'],
      required: true,
    },
    confidence: { type: Number, min: 0, max: 1 },
    modelVersion: { type: String, default: '1.0' },

    // Actions taken
    autoSOSTriggerred: { type: Boolean, default: false },
    alertSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RiskLog', riskLogSchema);
