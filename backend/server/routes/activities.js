
import express from 'express';
import { body, validationResult } from 'express-validator';
import Activity from '../models/Activity.js';
import CarbonScore from '../models/CarbonScore.js';
import { calculateCO2, generateEcoTips, categoryBreakdown } from '../utils/carbonCalculator.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const SKIP_DB = process.env.NODE_ENV === 'test';

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
    // Additional numeric validation
    const numericFields = [
      transport?.carKm, transport?.bikeKm, transport?.busKm, transport?.walkKm,
      electricity?.kwhUsed,
      food?.meat, food?.dairy, food?.vegetables, food?.processed
    ];
    if (numericFields.some(v => v !== undefined && (isNaN(v) || v < 0))) {
      return res.status(400).json({ error: 'All numeric values must be non-negative numbers' });
    }
    if (transport?.carKm > 1000 || electricity?.kwhUsed > 1000) {
      return res.status(400).json({ error: 'Values exceed reasonable daily limits' });
    }
    const activityData = { transport, electricity, food };
    const totalCO2 = calculateCO2(activityData);
    
    let activity;

    try {
      if (SKIP_DB) throw new Error('Skip DB in test');
      activity = new Activity({ userId: req.user._id, transport, electricity, food, totalCO2, date: new Date() });
      await activity.save();
      try {
        if (!SKIP_DB) {
          let carbonScore = await CarbonScore.findOne({ userId: req.user._id });
          if (!carbonScore) carbonScore = new CarbonScore({ userId: req.user._id, dailyScore: 0 });
          carbonScore.dailyScore += totalCO2;
          await carbonScore.save();
        }
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
      if (SKIP_DB) throw new Error('Skip DB in test');
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

      activities = await Activity.find({ userId: req.user._id, ...dateFilter }).sort({ date: -1 });

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

// Simulation endpoint (POST /api/activities/simulate) to compare hypothetical changes
router.post('/simulate', auth, async (req,res) => {
  try {
    const { current, proposed } = req.body || {};
    if (!current || !proposed) return res.status(400).json({ error: 'Provide current and proposed activity objects' });
    const currentCO2 = calculateCO2(current);
    const proposedCO2 = calculateCO2(proposed);
    const savings = Number((currentCO2 - proposedCO2).toFixed(2));
    const pct = currentCO2 > 0 ? Number(((savings / currentCO2) * 100).toFixed(2)) : 0;
    res.json({
      current: { total: currentCO2, breakdown: categoryBreakdown(current) },
      proposed: { total: proposedCO2, breakdown: categoryBreakdown(proposed) },
      savings,
      savingsPercent: pct,
      message: savings > 0 ? `You could reduce emissions by ${savings} kg (${pct}%).` : 'No reduction achieved.'
    });
  } catch (e) {
    console.error('Simulation error', e);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

export default router;
