
import express from 'express';
import { body, validationResult } from 'express-validator';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import CarbonScore from '../models/CarbonScore.js';
import { calculateCO2, generateEcoTips } from '../utils/carbonCalculator.js';
import { auth } from '../middleware/auth.js';

// Use global temp storage
let tempActivityIdCounter = 1;

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

    let activity;
    try {
      activity = new Activity({
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
    } catch (dbError) {
      console.log('MongoDB not available, using temporary storage');
      
      // Create activity in temp storage
      activity = {
        _id: tempActivityIdCounter++,
        userId: req.user._id,
        transport,
        electricity,
        food,
        totalCO2,
        date: new Date()
      };
      
      global.tempActivities.push(activity);
    }

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
    
    let activities;
    const now = new Date();

    try {
      let dateFilter = {};

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

      activities = await Activity.find({
        userId: req.user._id,
        ...dateFilter
      }).sort({ date: -1 });
    } catch (dbError) {
      console.log('MongoDB not available, using temporary storage');
      
      // Filter activities from temp storage
      activities = global.tempActivities.filter(activity => {
        if (activity.userId !== req.user._id) return false;
        
        const activityDate = new Date(activity.date);
        
        if (period === 'day') {
          const startOfDay = new Date(now);
          startOfDay.setHours(0, 0, 0, 0);
          return activityDate >= startOfDay;
        } else if (period === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - 7);
          return activityDate >= startOfWeek;
        } else if (period === 'month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return activityDate >= startOfMonth;
        }
        return true;
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
