import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'driver', 'admin'], default: 'user' },

    mobile: { type: String, default: 'Not provided' },
    aadhaar: { type: String, default: 'Not provided' },
    location: { type: String, default: 'Not provided' },
    profession: {
      type: String,
      enum: [
        'Government / NER Admin',
        'District Authority',
        'Field Officer (BRO/PWD)',
        'Transport / Fleet Mgr',
        'Driver (Convoy)',
        'Disaster / Emergency Off.',
        'System Administrator',
        '',
      ],
      default: '',
    },

    // Driver-only fields
    dl: { type: String, default: '' }, // driving licence number
    vehiclePhotoUrl: { type: String, default: '' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    verified: { type: Boolean, default: true },

    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ username: 1, role: 1 }, { unique: true });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toProfileJSON = function toProfileJSON() {
  const isDriver = this.role === 'driver';
  return {
    id: this._id,
    username: this.username,
    role: this.role,
    roleLabel: isDriver
      ? 'Verified Driver · NER Logistics'
      : this.profession
      ? `${this.profession} · NER Logistics`
      : 'Field / Officer · NER Logistics',
    initials: (this.username?.trim()?.charAt(0) || 'U').toUpperCase(),
    mobile: this.mobile,
    aadhaar: this.aadhaar,
    location: this.location,
    profession: this.profession,
    dl: this.dl,
    vehiclePhotoUrl: this.vehiclePhotoUrl,
    isDriver,
  };
};

export default mongoose.model('User', userSchema);
