import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    tag: { type: String, enum: ['CRITICAL', 'HIGH RISK', 'UPDATE', 'LOGISTICS'], required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    source: { type: String, default: 'manual' }, // 'manual' | 'incident' | 'weather' | 'gdacs' | 'eonet'
    relatedRoad: { type: mongoose.Schema.Types.ObjectId, ref: 'Road', default: null },
    relatedIncident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Alert', alertSchema);
