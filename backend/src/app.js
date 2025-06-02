// src/app.js (or wherever you configure Express)

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import staffLots from './routes/staff/lots.js';
import staffReservations from './routes/staff/reservations.js';
import staffAnnouncements from './routes/staff/announcement.js';
import clientLots from './routes/client/lots.js';
import clientReservations from './routes/client/reservations.js';
import clientAnnouncements from './routes/client/announcement.js';
import adminUsers from './routes/admin/users.js';
import burialsRouter from './routes/admin/burials.js';
import intermentsRouter from './routes/admin/interments.js';
import paymentRouter from './routes/payment.js';
import financialRouter from './routes/admin/financial.js';
import activityLogsRouter from './routes/admin/activityLogs.js';
import reservationRoutes from './routes/reservationRoutes.js';

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, '../uploads');
const proofsDir = path.join(__dirname, '../uploads/proofs');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(proofsDir)) {
  fs.mkdirSync(proofsDir, { recursive: true });
}

// Health-check
app.get('/', (_req, res) => res.send('API is up!'));

// Auth
app.use('/api/auth', authRoutes);

// Staff routes
app.use('/api/staff/lots', staffLots);
app.use('/api/staff/reservations', staffReservations);
app.use('/api/staff/announcements', staffAnnouncements);

// Client routes
app.use('/api/client/lots', clientLots);
app.use('/api/client/reservations', clientReservations);
app.use('/api/client/announcements', clientAnnouncements);

// Admin routes
app.use('/api/admin/users', adminUsers);
app.use('/api/admin/logs', activityLogsRouter);
app.use('/api/admin/burials', burialsRouter);
app.use('/api/admin/interments', intermentsRouter);
app.use('/api/admin/reports/financial', financialRouter);

// Payment
app.use('/api/payment', paymentRouter);

// Reservation routes
app.use('/api/reservations', reservationRoutes);

// Connect to MongoDB & start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✔️ MongoDB connected'))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
