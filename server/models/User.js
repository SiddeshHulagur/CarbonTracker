
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  totalCarbonFootprint: {
    type: Number,
    default: 0
  },
  goals: {
    dailyTarget: {
      type: Number,
      default: 50
    },
    monthlyTarget: {
      type: Number,
      default: 1500
    }
  },
  achievements: [{
    name: String,
    dateEarned: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
