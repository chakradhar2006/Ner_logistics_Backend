import mongoose from 'mongoose';

const roadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "Coastal Road B"
    district: { type: String, required: true },
    status: { type: String, enum: ['Accessible', 'Risky', 'Blocked'], default: 'Accessible' },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    riskReason: { type: String, default: '' }, // "Landslide", "Flooding Risk"
    coordinates: {
      start: { lat: Number, lng: Number },
      end: { lat: Number, lng: Number },
    },
    source: { type: String, default: 'manual' }, // 'manual' | 'incident-report' | 'gdacs' | 'eonet'
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Road', roadSchema);
