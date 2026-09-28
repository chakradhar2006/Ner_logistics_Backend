import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    notifyCritical: { type: Boolean, default: true },
    notifyHighRisk: { type: Boolean, default: true },
    notifyUpdates: { type: Boolean, default: false },
    notifySound: { type: Boolean, default: true },

    mapDefaultLayer: { type: String, enum: ['vehicles', 'incidents', 'roads', 'all'], default: 'all' },
    mapProvider: { type: String, enum: ['osm', 'satellite'], default: 'osm' },

    refreshIntervalSeconds: { type: Number, default: 30, min: 10, max: 300 },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: {
      type: String,
      enum: ['en', 'hi', 'as', 'bn', 'mni', 'ne', 'brx', 'kha', 'grt', 'lus', 'trp', 'nag'],
      default: 'en',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
