const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema(
  {
    fishermanName: { type: String, required: true },
    boatName: { type: String, required: true },
    contact: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
    location: { type: String }, // human-readable "19.07°N, 72.88°E"
    crewSize: { type: Number, default: 1 },
    emergency: { type: String, required: true },
    description: { type: String, default: '' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'High',
    },
    status: {
      type: String,
      enum: ['Active', 'Coast Guard Dispatched', 'Resolved'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

// Virtual: distance label (placeholder — real distance calc would need a vessel DB)
sosAlertSchema.virtual('timeAgo').get(function () {
  const diff = Date.now() - this.createdAt;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
});

sosAlertSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SOSAlert', sosAlertSchema);
