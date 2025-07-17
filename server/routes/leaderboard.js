import express from 'express';
import User from '../models/User.js';
import CarbonScore from '../models/CarbonScore.js';
import Activity from '../models/Activity.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get leaderboard data
router.get('/', auth, async (req, res) => {
  try {
    let leaderboard = [];

    try {
      // Try MongoDB first
      const users = await User.find({}).select('name email');

      const leaderboardData = await Promise.all(
        users.map(async (user) => {
          const activities = await Activity.find({ userId: user._id });
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
        const userActivities = activities.filter(a => a.userId === user._id);
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

    res.json({
      leaderboard,
      currentUserRank: leaderboard.find(user => user.userId === req.user._id)?.rank || null
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to load leaderboard data' });
  }
});

export default router;