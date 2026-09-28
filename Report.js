import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // "Daily Logistics Summary"
    cadence: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'FIELD'], required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Ready', 'Generating'], default: 'Generating' },
    fileUrl: { type: String, default: '' },
    generatedAt: { type: Date, default: null },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
