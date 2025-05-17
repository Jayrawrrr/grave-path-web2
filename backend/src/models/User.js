// backend/src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Now split name into firstName/lastName, both optional until full registration
  firstName:        { type: String, default: '' },
  lastName:         { type: String, default: '' },

  // Email is required for both steps
  email:            { type: String, required: true, unique: true },

  // Password is optional at pre-registration (sending code)
  password:         { type: String, default: '' },

  role:             { type: String, enum: ['client','staff','admin'], default: 'client' },

  emailVerified:    { type: Boolean, default: false },
  verificationCode: { type: String, default: null }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
