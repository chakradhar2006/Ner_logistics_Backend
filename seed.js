import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Delivery from '../models/Delivery.js';
import Road from '../models/Road.js';
import Alert from '../models/Alert.js';
import Report from '../models/Report.js';
import Incident from '../models/Incident.js';

async function seed() {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    Delivery.deleteMany({}),
    Road.deleteMany({}),
    Alert.deleteMany({}),
    Report.deleteMany({}),
    Incident.deleteMany({}),
  ]);

  console.log('Creating users...');
  const director = await User.create({
    username: 'Director Shubham',
    password: 'password123',
    role: 'admin',
    mobile: '+91 90000 00001',
    aadhaar: 'Not provided',
    location: 'Command Hub Alpha, Sector 4',
  });

  const rajesh = await User.create({
    username: 'Rajesh Kumar',
    password: 'password123',
    role: 'driver',
    mobile: '+91 98765 43210',
    aadhaar: '**** **** 1234',
    location: 'Sector 4, Field Unit',
    dl: 'AS-0420110012345',
  });

  const amit = await User.create({
    username: 'Amit Singh',
    password: 'password123',
    role: 'driver',
    mobile: '+91 91234 56789',
    aadhaar: '**** **** 5678',
    location: 'Hub A',
    dl: 'ML-0520090054321',
  });

  const priya = await User.create({
    username: 'Priya Das',
    password: 'password123',
    role: 'driver',
    mobile: '+91 99887 76655',
    aadhaar: '**** **** 9012',
    location: 'Main Terminal',
    dl: 'AS-0120150098765',
  });

  console.log('Creating vehicles...');
  const tata407 = await Vehicle.create({
    name: 'Tata 407',
    number: 'AS 01 AB 4821',
    type: 'Cargo Truck',
    capacityTons: 2.5,
    status: 'Active',
    owner: rajesh._id,
    currentLocation: { lat: 26.1445, lng: 91.7362, updatedAt: new Date() }, // Guwahati
  });

  const bolero = await Vehicle.create({
    name: 'Mahindra Bolero Pickup',
    number: 'ML 05 C 9124',
    type: 'Utility Pickup',
    capacityTons: 1.7,
    status: 'Active',
    owner: amit._id,
    currentLocation: { lat: 25.578, lng: 91.8933, updatedAt: new Date() }, // Shillong
  });

  const dost = await Vehicle.create({
    name: 'Ashok Leyland Dost',
    number: 'AS 02 PQ 7712',
    type: 'Mini Truck',
    capacityTons: 1.2,
    status: 'Active',
    owner: priya._id,
    currentLocation: { lat: 24.8333, lng: 92.7789, updatedAt: new Date() }, // Silchar
  });

  await User.findByIdAndUpdate(rajesh._id, { vehicle: tata407._id });
  await User.findByIdAndUpdate(amit._id, { vehicle: bolero._id });

  console.log('Creating roads...');
  const [hwy42, route6, coastalB, industrialBlvd, valley12] = await Promise.all([
    Road.create({
      name: 'Highway 42 (North)',
      district: 'North District',
      status: 'Accessible',
      riskLevel: 'Low',
      coordinates: { start: { lat: 26.6528, lng: 92.7926 }, end: { lat: 26.7509, lng: 93.1638 } }, // Nagaon -> Tezpur corridor
      lastUpdatedAt: new Date(Date.now() - 10 * 60 * 1000),
    }),
    Road.create({
      name: 'Route 6 - Mountain Pass',
      district: 'East District',
      status: 'Risky',
      riskLevel: 'Medium',
      riskReason: '',
      coordinates: { start: { lat: 25.578, lng: 91.8933 }, end: { lat: 25.4670, lng: 92.3600 } }, // Shillong -> Jowai
      lastUpdatedAt: new Date(Date.now() - 22 * 60 * 1000),
    }),
    Road.create({
      name: 'Coastal Road B',
      district: 'South District',
      status: 'Blocked',
      riskLevel: 'High',
      riskReason: 'Landslide',
      coordinates: { start: { lat: 24.8333, lng: 92.7789 }, end: { lat: 24.6637, lng: 93.0155 } }, // Silchar -> towards Manipur border
      lastUpdatedAt: new Date(Date.now() - 60 * 60 * 1000),
    }),
    Road.create({
      name: 'Industrial Park Blvd',
      district: 'West District',
      status: 'Accessible',
      riskLevel: 'Low',
      coordinates: { start: { lat: 26.1445, lng: 91.7362 }, end: { lat: 26.2006, lng: 91.6522 } }, // Guwahati industrial belt
      lastUpdatedAt: new Date(Date.now() - 5 * 60 * 1000),
    }),
    Road.create({
      name: 'Valley Connection 12',
      district: 'East District',
      status: 'Risky',
      riskLevel: 'Medium',
      riskReason: 'Flooding Risk',
      coordinates: { start: { lat: 25.9088, lng: 93.7414 }, end: { lat: 25.6751, lng: 94.1077 } }, // Mokokchung -> Zunheboto
      lastUpdatedAt: new Date(Date.now() - 45 * 60 * 1000),
    }),
  ]);

  console.log('Creating deliveries...');
  await Delivery.create([
    {
      displayId: '#8472',
      originLabel: 'Sector 4',
      destinationLabel: 'Main Terminal',
      district: 'North District',
      driver: rajesh._id,
      vehicle: tata407._id,
      status: 'In Progress',
      etaMinutes: 18,
      priority: 'Medium',
      cargoType: 'General Cargo',
    },
    {
      displayId: '#8471',
      originLabel: 'Hub A',
      destinationLabel: 'Sector 7',
      district: 'East District',
      driver: amit._id,
      vehicle: bolero._id,
      status: 'Assigned',
      etaMinutes: 34,
      priority: 'High',
      cargoType: 'Food Supplies',
    },
    {
      // Deliberately in South District, which has "Coastal Road B" seeded as
      // Blocked below — so the AI Recovery Engine on the Vehicles page has a
      // real disruption to show out of the box, not an empty state.
      displayId: '#8465',
      originLabel: 'Main Terminal',
      destinationLabel: 'Hub B',
      district: 'South District',
      driver: priya._id,
      vehicle: dost._id,
      status: 'Delayed',
      etaMinutes: 70,
      priority: 'Critical',
      cargoType: 'Medicines',
    },
    {
      displayId: '#8460',
      originLabel: 'Hub B',
      destinationLabel: 'Sector 2',
      district: 'South District',
      driver: rajesh._id,
      status: 'Delayed',
      etaMinutes: 90,
      priority: 'Medium',
      cargoType: 'Construction Materials',
    },
    {
      displayId: '#8458',
      originLabel: 'Sector 1',
      destinationLabel: 'Hub A',
      district: 'North District',
      driver: amit._id,
      status: 'Completed',
      etaMinutes: null,
      priority: 'Low',
      cargoType: 'Agricultural Goods',
    },
  ]);

  console.log('Creating incidents...');
  const landslideIncident = await Incident.create({
    reportedBy: rajesh._id,
    type: 'Landslide',
    severity: 'Critical',
    description: 'Heavy rainfall has caused a severe landslide blocking both lanes near Sector 7.',
    locationLabel: 'NH-44, Sector 7',
    coordinates: { lat: 24.75, lng: 92.9 }, // between Silchar and the Manipur border, on Coastal Road B
    road: coastalB._id,
    status: 'Open',
  });

  console.log('Creating alerts...');
  await Alert.create([
    {
      tag: 'CRITICAL',
      title: 'Road blocked: NH-44 Landslide',
      description:
        'Heavy rainfall has caused a severe landslide blocking both lanes near Sector 7. Convoys are being rerouted via Highway 42.',
      source: 'incident',
      relatedIncident: landslideIncident._id,
      relatedRoad: coastalB._id,
    },
    {
      tag: 'HIGH RISK',
      title: 'Sector 4 Heavy Rain',
      description:
        'Visibility reduced to under 50m. All vehicles in Sector 4 advised to reduce speed and maintain radio contact.',
      source: 'weather',
    },
    {
      tag: 'UPDATE',
      title: 'Bridge Maintenance Complete',
      description: 'Structural repairs on Teesta Bridge finished ahead of schedule. Route reopened to full load capacity.',
      source: 'manual',
    },
    {
      tag: 'LOGISTICS',
      title: 'Convoy C-09 Arrived',
      description: 'Medical supplies convoy C-09 has successfully reached Hub B without incident.',
      source: 'manual',
    },
    {
      tag: 'UPDATE',
      title: 'Weekly Safety Briefing Posted',
      description: 'Regional safety briefing for the week is now available for all field officers.',
      source: 'manual',
    },
    {
      tag: 'LOGISTICS',
      title: 'Fleet Inspection Reminder',
      description: '14 vehicles are due for scheduled maintenance inspection before end of month.',
      source: 'manual',
    },
  ]);

  console.log('Creating reports...');
  await Report.create([
    {
      title: 'Daily Logistics Summary',
      cadence: 'DAILY',
      description: 'Vehicles, deliveries and incidents recorded across all districts today.',
      status: 'Ready',
      generatedAt: new Date(),
    },
    {
      title: 'Incident Report Log',
      cadence: 'FIELD',
      description: 'Full history of field incident reports submitted by officers and drivers.',
      status: 'Ready',
      generatedAt: new Date(),
    },
    {
      title: 'Fleet Utilization Report',
      cadence: 'WEEKLY',
      description: 'Vehicle usage, idle time, and maintenance status across the fleet.',
      status: 'Ready',
      generatedAt: new Date(),
    },
    {
      title: 'Route Risk Assessment',
      cadence: 'MONTHLY',
      description: 'Aggregated risk scoring for all monitored roads and corridors.',
      status: 'Generating',
    },
  ]);

  console.log('\nSeed complete. Sample login credentials:');
  console.log('  Admin  -> username: "Director Shubham" | password: password123 | role: admin');
  console.log('  Driver -> username: "Rajesh Kumar"      | password: password123 | role: driver');
  console.log('  Driver -> username: "Amit Singh"        | password: password123 | role: driver');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
