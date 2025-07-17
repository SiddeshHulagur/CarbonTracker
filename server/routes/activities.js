
import express from 'express';
import { body, validationResult } from 'express-validator';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import CarbonScore from '../models/CarbonScore.js';
import { calculateCO2, generateEcoTips } from '../utils/carbonCalculator.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Log activity
router.post('/', auth, [
  body('transport').optional().isObject(),
  body('electricity').optional().isObject(),
  body('food').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transport, electricity, food } = req.body;
    
    const activityData = { transport, electricity, food };
    const totalCO2 = calculateCO2(activityData);

    const activity = new Activity({
      userId: req.user._id,
      transport,
      electricity,
      food,
      totalCO2
    });

    await activity.save();

    // Update user's total carbon footprint
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalCarbonFootprint: totalCO2 }
    });

    // Update carbon scores
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let carbonScore = await CarbonScore.findOne({
      userId: req.user._id,
      date: { $gte: today }
    });

    if (!carbonScore) {
      carbonScore = new CarbonScore({
        userId: req.user._id,
        date: today
      });
    }

    carbonScore.dailyScore += totalCO2;
    await carbonScore.save();

    const tips = generateEcoTips(activityData, totalCO2);

    res.status(201).json({
      activity,
      totalCO2,
      tips
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user activities
router.get('/', auth, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let dateFilter = {};
    const now = new Date();

    if (period === 'day') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter = { date: { $gte: startOfDay } };
    } else if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      dateFilter = { date: { $gte: startOfWeek } };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { date: { $gte: startOfMonth } };
    }

    const activities = await Activity.find({
      userId: req.user._id,
      ...dateFilter
    }).sort({ date: -1 });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
