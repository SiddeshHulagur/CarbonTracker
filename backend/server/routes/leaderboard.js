import express from 'express';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const SKIP_DB = process.env.NODE_ENV === 'test';

// Get leaderboard data
router.get('/', auth, async (req, res) => {
  try {
    let leaderboard = [];
    const { period = 'month' } = req.query; // 'week' | 'month'
    const now = new Date();
    let startDate;
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    try {
      if (SKIP_DB) throw new Error('Skip DB in test');
      // Try MongoDB first
      const users = await User.find({}).select('name email');

      const leaderboardData = await Promise.all(
        users.map(async (user) => {
          const query = startDate ? { userId: user._id, date: { $gte: startDate } } : { userId: user._id };
          const activities = await Activity.find(query);
          const totalCO2 = activities.reduce((sum, activity) => sum + activity.totalCO2, 0);
          const activitiesCount = activities.length;

          return {
            userId: user._id,
            name: user.name,
            email: user.email,
            totalCO2: Math.round(totalCO2 * 100) / 100,
            activitiesCount,
            rank: 0 // Will be set after sorting
          };
        })
      );

      // Sort by lowest CO2 (better ranking)
      leaderboard = leaderboardData
        .sort((a, b) => a.totalCO2 - b.totalCO2)
        .map((user, index) => ({
          ...user,
          rank: index + 1
        }));

  } catch (dbError) {
      console.log('MongoDB not available, using temp storage');

      // Fallback to temp storage
      const users = global.tempUsers || [];
      const activities = global.tempActivities || [];

      const leaderboardData = users.map(user => {
        let userActivities = activities.filter(a => a.userId === user._id);
        if (startDate) {
          userActivities = userActivities.filter(a => new Date(a.date) >= startDate);
        }
        const totalCO2 = userActivities.reduce((sum, activity) => sum + activity.totalCO2, 0);
        const activitiesCount = userActivities.length;

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          totalCO2: Math.round(totalCO2 * 100) / 100,
          activitiesCount,
          rank: 0
        };
      });

      // Sort by lowest CO2 (better ranking)
      leaderboard = leaderboardData
        .sort((a, b) => a.totalCO2 - b.totalCO2)
        .map((user, index) => ({
          ...user,
          rank: index + 1
        }));
    }

    // Transform to frontend-friendly shape
    const currentUser = leaderboard.find(u => u.userId.toString() === req.user._id.toString());
    res.json({
      leaderboard: leaderboard.slice(0, 10).map(u => ({
        id: u.userId,
        name: u.name,
        rank: u.rank,
        totalEmissions: u.totalCO2,
        activitiesCount: u.activitiesCount
      })),
      currentUser: currentUser ? {
        id: currentUser.userId,
        name: currentUser.name,
        rank: currentUser.rank,
        totalEmissions: currentUser.totalCO2,
        activitiesCount: currentUser.activitiesCount
      } : null
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to load leaderboard data' });
  }
});

export default router;