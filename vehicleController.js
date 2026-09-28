import Vehicle from '../models/Vehicle.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const listVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find().populate('owner', 'username role').sort({ createdAt: -1 });
  res.json({ vehicles });
});

export const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'username role');
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
  res.json({ vehicle });
});

export const createVehicle = asyncHandler(async (req, res) => {
  const { name, number, type, capacityTons, owner } = req.body;
  if (!name || !number || !type || !capacityTons) {
    return res.status(400).json({ message: 'name, number, type and capacityTons are required.' });
  }
  const vehicle = await Vehicle.create({
    name,
    number,
    type,
    capacityTons,
    owner: owner || req.user._id,
    photoUrl: req.file ? `/uploads/${req.file.filename}` : '',
  });
  res.status(201).json({ vehicle });
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
  res.json({ vehicle });
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
  res.json({ message: 'Vehicle removed.' });
});
