
import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  transport: {
    carKm: { type: Number, default: 0 },
    bikeKm: { type: Number, default: 0 },
    busKm: { type: Number, default: 0 },
    walkKm: { type: Number, default: 0 }
  },
  electricity: {
    kwhUsed: { type: Number, default: 0 }
  },
  food: {
    meat: { type: Number, default: 0 }, // servings
    dairy: { type: Number, default: 0 }, // servings
    vegetables: { type: Number, default: 0 }, // servings
    processed: { type: Number, default: 0 } // servings
  },
  totalCO2: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Activity', activitySchema);
