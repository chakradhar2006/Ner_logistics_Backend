import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// POST /api/auth/register
// body: { role: 'user'|'driver', username, password, aadhaar, mobile, location, dl? }
export const register = asyncHandler(async (req, res) => {
  const { role = 'user', username, password, aadhaar, mobile, location, dl, profession } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  if (!['user', 'driver'].includes(role)) {
    return res.status(400).json({ message: 'Role must be "user" or "driver".' });
  }

  const existing = await User.findOne({ username, role });
  if (existing) {
    return res.status(409).json({ message: 'An account with this username already exists for this role.' });
  }

  const user = await User.create({
    username,
    password,
    role,
    aadhaar: aadhaar || 'Not provided',
    mobile: mobile || 'Not provided',
    location: location || 'Not provided',
    profession: role === 'user' ? profession || '' : '',
    dl: role === 'driver' ? dl || 'Not provided' : '',
    vehiclePhotoUrl: req.file ? `/uploads/${req.file.filename}` : '',
  });

  res.status(201).json({
    message: `Account created. Sign in with your new ${role} credentials to continue.`,
    profile: user.toProfileJSON(),
  });
});

// POST /api/auth/login
// body: { role: 'user'|'driver', username, password }
export const login = asyncHandler(async (req, res) => {
  const { role = 'user', username, password } = req.body;

  const user = await User.findOne({ username, role }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  res.json({ token, profile: user.toProfileJSON() });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ profile: req.user.toProfileJSON() });
});
