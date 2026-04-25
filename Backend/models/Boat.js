const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { hashDeviceKey } = require('../services/encryptionService');

const boatSchema = new mongoose.Schema(
  {
    boatId: {
      type: String,
      required: true,
      unique: true,
      default: () => `BOAT-${uuidv4().slice(0, 8).toUpperCase()}`,
    },
    name: { type: String, required: true },
    ownerName: { type: String, required: true },
    contact: { type: String, required: true },
    registrationNumber: { type: String },
    homePort: { type: String, default: 'Unknown' },

    // Device authentication
    deviceKeyHash: { type: String, required: true },  // hashed deviceKey
    isActive: { type: Boolean, default: true },
    lastSeen: { type: Date },

    // Last known position (updated by heartbeat)
    lastLat: { type: Number },
    lastLng: { type: Number },
    lastPositionAt: { type: Date },

    // Vessel specs
    vesselType: { type: String, default: 'Fishing Boat' },
    crewCapacity: { type: Number, default: 5 },

    // Risk tracking
    currentRiskLevel: {
      type: String,
      enum: ['SAFE', 'WARNING', 'DANGER'],
      default: 'SAFE',
    },
  },
  { timestamps: true }
);

// Method to safely register a new boat with hashed key
boatSchema.statics.register = async function (data, plainDeviceKey) {
  const keyHash = hashDeviceKey(plainDeviceKey);
  return this.create({ ...data, deviceKeyHash: keyHash });
};

// Virtual: display-friendly position string
boatSchema.virtual('positionStr').get(function () {
  if (!this.lastLat || !this.lastLng) return 'Unknown';
  return `${this.lastLat.toFixed(4)}°N, ${this.lastLng.toFixed(4)}°E`;
});

boatSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Boat', boatSchema);
