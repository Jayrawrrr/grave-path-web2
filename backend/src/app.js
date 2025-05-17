import express  from 'express';
import mongoose from 'mongoose';
import cors     from 'cors';
import dotenv   from 'dotenv';

import authRoutes  from './routes/auth.js';
import staffLots   from './routes/staff/lots.js';
import clientLots  from './routes/client/lots.js';
import adminUsers  from './routes/admin/users.js';

dotenv.config();

const app = express();

// CORS for only your React app:
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

// Health-check
app.get('/', (_req, res) => res.send('API is up!'));

// MOUNT ALL ROUTERS — note: **no** full URLs, only relative paths:
app.use('/api/auth',         authRoutes);
app.use('/api/staff/lots',   staffLots);
app.use('/api/client/lots',  clientLots);
app.use('/api/admin/users',  adminUsers);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✔️ MongoDB connected'))
  .catch(err => console.error(err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
