
import mongoose from 'mongoose';

const carbonScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  dailyScore: {
    type: Number,
    default: 0
  },
  weeklyScore: {
    type: Number,
    default: 0
  },
  monthlyScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('CarbonScore', carbonScoreSchema);
