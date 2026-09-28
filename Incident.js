import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['Road blockage', 'Landslide', 'Heavy rain', 'Vehicle breakdown', 'Other'],
      required: true,
    },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    description: { type: String, default: '' },
    locationLabel: { type: String, default: '' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    photoUrl: { type: String, default: '' },
    road: { type: mongoose.Schema.Types.ObjectId, ref: 'Road', default: null },
    status: { type: String, enum: ['Open', 'Reviewing', 'Resolved'], default: 'Open' },
  },
  { timestamps: true }
);

export default mongoose.model('Incident', incidentSchema);
