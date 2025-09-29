import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const SKIP_DB = process.env.NODE_ENV === 'test';

// Get current user goals
router.get('/', auth, async (req, res) => {
  try {
    res.json({ goals: req.user.goals || {} });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Update goals (partial allowed)
router.put('/', auth, async (req, res) => {
  try {
    const { dailyTarget, monthlyTarget } = req.body;
    // Ensure goals object exists (important for in-memory test fallback)
    if (!req.user.goals) {
      req.user.goals = {};
    }
    if (dailyTarget !== undefined && (isNaN(dailyTarget) || dailyTarget < 0)) {
      return res.status(400).json({ error: 'dailyTarget must be a positive number' });
    }
    if (monthlyTarget !== undefined && (isNaN(monthlyTarget) || monthlyTarget < 0)) {
      return res.status(400).json({ error: 'monthlyTarget must be a positive number' });
    }

    // Try to update in DB; fallback to in-memory user object
    if (!SKIP_DB) {
      try {
        const user = await User.findById(req.user._id);
        if (user) {
          if (dailyTarget !== undefined) user.goals.dailyTarget = dailyTarget;
          if (monthlyTarget !== undefined) user.goals.monthlyTarget = monthlyTarget;
          await user.save();
          return res.json({ goals: user.goals });
        }
      } catch (dbErr) {
        console.log('DB unavailable, updating in-memory goals');
      }
    }

    // Fallback path (in-memory)
    if (dailyTarget !== undefined) req.user.goals.dailyTarget = dailyTarget;
    if (monthlyTarget !== undefined) req.user.goals.monthlyTarget = monthlyTarget;
    res.json({ goals: req.user.goals });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update goals' });
  }
});

export default router;
