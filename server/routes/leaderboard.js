
import express from 'express';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get leaderboard
router.get('/', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let dateFilter = {};
    
    if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      dateFilter = { date: { $gte: startOfWeek } };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { date: { $gte: startOfMonth } };
    }

    // Get all users
    const users = await User.find({}, 'name email').lean();
    
    // Calculate emissions for each user
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        const activities = await Activity.find({
          userId: user._id,
          ...dateFilter
        });
        
        const totalEmissions = activities.reduce((sum, activity) => sum + activity.totalCO2, 0);
        
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          totalEmissions: Math.round(totalEmissions * 100) / 100,
          rank: 0 // Will be set after sorting
        };
      })
    );

    // Sort by lowest emissions (best performers first)
    leaderboardData.sort((a, b) => a.totalEmissions - b.totalEmissions);
    
    // Add ranks
    leaderboardData.forEach((user, index) => {
      user.rank = index + 1;
    });

    // Find current user's position
    const currentUserRank = leaderboardData.find(user => 
      user.id.toString() === req.user._id.toString()
    );

    res.json({
      leaderboard: leaderboardData.slice(0, 10), // Top 10
      currentUser: currentUserRank,
      period
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
