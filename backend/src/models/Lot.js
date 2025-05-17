// backend/src/models/Lot.js
import mongoose from 'mongoose';

const lotSchema = new mongoose.Schema({
  id:      { type: String, required: true, unique: true },
  bounds:  { type: [[Number]], required: true }, // [[lat, lng], [lat, lng]]
  name:    { type: String, default: '' },
  birth:   { type: String, default: '' },
  death:   { type: String, default: '' },
  status:  { type: String, enum: ['available','unavailable','active'], default: 'available' },
});

export default mongoose.model('Lot', lotSchema);
