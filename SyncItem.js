import mongoose from 'mongoose';

const syncItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: ['report', 'photo', 'profile', 'other'], required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['pending', 'synced', 'failed'], default: 'pending' },
    syncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('SyncItem', syncItemSchema);
