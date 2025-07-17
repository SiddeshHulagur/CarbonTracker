
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
    let startDate;
    
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    let users, allActivities;
    
    try {
      // Get all users
      users = await User.find({}, 'name email').lean();
      
      // Get all activities for the period
      let dateFilter = {};
      if (startDate) {
        dateFilter = { date: { $gte: startDate } };
      }
      
      allActivities = await Activity.find(dateFilter);
    } catch (dbError) {
      console.log('MongoDB not available, using temporary storage');
      
      // Use temp storage
      const tempUsers = global.tempUsers || [];
      const tempActivities = global.tempActivities || [];
      
      // Filter users to include current user if not in temp storage
      users = tempUsers.length > 0 ? tempUsers.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email
      })) : [{
        _id: req.user._id,
        name: 'Demo User',
        email: 'demo@example.com'
      }];
      
      // Filter activities by period
      allActivities = tempActivities.filter(activity => {
        if (!startDate) return true;
        return new Date(activity.date) >= startDate;
      });
    }
    
    // Calculate emissions for each user
    const leaderboardData = users.map(user => {
      const userActivities = allActivities.filter(activity => 
        activity.userId.toString() === user._id.toString()
      );
      
      const totalEmissions = userActivities.reduce((sum, activity) => sum + activity.totalCO2, 0);
      
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        totalEmissions: Math.round(totalEmissions * 100) / 100,
        rank: 0 // Will be set after sorting
      };
    });

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
