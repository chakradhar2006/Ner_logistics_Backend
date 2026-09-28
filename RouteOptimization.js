import mongoose from 'mongoose';

const routeOptionSchema = new mongoose.Schema(
  {
    label: String, // "Route A"
    distanceKm: Number,
    durationText: String, // "3h 20m"
    durationMinutes: Number,
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
    riskReasons: [String],
    recommended: { type: Boolean, default: false },
    polyline: String, // encoded polyline from Google Directions
    etaClock: String,
  },
  { _id: false }
);

const routeOptimizationSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    originLabel: String,
    destinationLabel: String,
    origin: { lat: Number, lng: Number },
    destination: { lat: Number, lng: Number },
    options: [routeOptionSchema],
  },
  { timestamps: true }
);

export default mongoose.model('RouteOptimization', routeOptimizationSchema);
