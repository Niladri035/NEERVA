const mongoose = require('mongoose');

const sosEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      unique: true,
      default: () => `SOS-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    },
    boatId: { type: String, required: true, index: true },
    fishermanName: { type: String },
    boatName: { type: String },
    contact: { type: String },

    // Trigger type
    triggerType: {
      type: String,
      enum: ['manual', 'voice', 'auto-no-movement', 'auto-high-risk', 'auto-no-response', 'test'],
      default: 'manual',
    },

    // Location at time of SOS
    location: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number }, // GPS accuracy in meters
      locationStr: { type: String },
    },

    // Emergency details
    emergency: { type: String, required: true },
    description: { type: String, default: '' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'High',
    },

    // Risk snapshot at time of SOS
    riskSnapshot: {
      risk: { type: String },
      confidence: { type: Number },
      temperature: { type: Number },
      windSpeed: { type: Number },
      pressure: { type: Number },
    },

    // Status
    status: {
      type: String,
      enum: ['Active', 'Coast Guard Dispatched', 'Resolved', 'False Alarm'],
      default: 'Active',
    },
    resolvedAt: { type: Date },

    // Communication result
    communicationLayer: { type: String, enum: ['internet', 'sms', 'lora', null], default: null },
    communicationResult: { type: mongoose.Schema.Types.Mixed },

    // Nearby boats notified
    nearbyBoatsNotified: { type: Number, default: 0 },

    // Encryption flag
    wasEncrypted: { type: Boolean, default: false },
    crewSize: { type: Number, default: 1 },
  },
  { timestamps: true }
);

sosEventSchema.virtual('timeAgo').get(function () {
  const diff = Date.now() - this.createdAt;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
});

sosEventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SOSEvent', sosEventSchema);
