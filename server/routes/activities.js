
import express from 'express';
import { body, validationResult } from 'express-validator';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import CarbonScore from '../models/CarbonScore.js';
import { calculateCO2, generateEcoTips } from '../utils/carbonCalculator.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Initialize temp storage if not exists
if (!global.tempActivities) {
  global.tempActivities = [];
}

let tempActivityIdCounter = 1;

// Log activity
router.post('/', [
  body('transport').isObject(),
  body('electricity').isObject(),
  body('food').isObject()
], auth, async (req, res) => {
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
      // Try MongoDB first
      activity = new Activity({
        userId: req.user._id,
        transport,
        electricity,
        food,
        totalCO2,
        date: new Date()
      });

      await activity.save();

      // Update carbon score if available
      try {
        let carbonScore = await CarbonScore.findOne({ userId: req.user._id });
        if (!carbonScore) {
          carbonScore = new CarbonScore({ userId: req.user._id, dailyScore: 0 });
        }
        carbonScore.dailyScore += totalCO2;
        await carbonScore.save();
      } catch (scoreError) {
        console.log('Carbon score update failed:', scoreError);
      }

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
    console.error('Activity logging error:', error);
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
      // Try MongoDB first
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
      console.log('MongoDB not available, using temp storage');
      
      // Fallback to temp storage
      const userActivities = global.tempActivities?.filter(a => a.userId === req.user._id) || [];
      
      // Apply date filtering
      if (period === 'day') {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        activities = userActivities.filter(a => new Date(a.date) >= startOfDay);
      } else if (period === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        activities = userActivities.filter(a => new Date(a.date) >= startOfWeek);
      } else if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        activities = userActivities.filter(a => new Date(a.date) >= startOfMonth);
      } else {
        activities = userActivities;
      }
      
      // Sort by date (newest first)
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
