import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Tata 407"
    number: { type: String, required: true, unique: true }, // e.g. "AS 01 AB 4821"
    type: { type: String, required: true }, // e.g. "Cargo Truck", "Utility Pickup"
    capacityTons: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Maintenance', 'Inactive'], default: 'Active' },
    photoUrl: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currentLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Vehicle', vehicleSchema);
