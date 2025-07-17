
import express from 'express';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import CarbonScore from '../models/CarbonScore.js';
import { generateEcoTips } from '../utils/carbonCalculator.js';
import { auth } from '../middleware/auth.js';

// Access temp storage from global

const router = express.Router();

// Get dashboard data
router.get('/', auth, async (req, res) => {
  try {
    let user, recentActivities, dailyActivities, weeklyActivities, monthlyActivities;
    const now = new Date();

    try {
      user = await User.findById(req.user._id);
      
      // Get recent activities for tips
      recentActivities = await Activity.find({
        userId: req.user._id
      }).sort({ date: -1 }).limit(5);

      // Calculate period totals
      // Daily total
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      dailyActivities = await Activity.find({
        userId: req.user._id,
        date: { $gte: startOfDay }
      });

      // Weekly total
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      weeklyActivities = await Activity.find({
        userId: req.user._id,
        date: { $gte: startOfWeek }
      });

      // Monthly total
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      monthlyActivities = await Activity.find({
        userId: req.user._id,
        date: { $gte: startOfMonth }
      });
    } catch (dbError) {
      console.log('MongoDB not available, using temporary storage');
      
      // Find user in temp storage
      const tempUsers = global.tempUsers || [];
      user = tempUsers.find(u => u._id == req.user._id) || {
        name: 'Demo User',
        totalCarbonFootprint: 0,
        goals: { dailyTarget: 50, monthlyTarget: 1500 }
      };
      
      // Get activities from temp storage
      const tempActivities = global.tempActivities || [];
      const userActivities = tempActivities.filter(a => a.userId == req.user._id);
      
      // Filter by periods
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      dailyActivities = userActivities.filter(a => new Date(a.date) >= startOfDay);
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      weeklyActivities = userActivities.filter(a => new Date(a.date) >= startOfWeek);
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      monthlyActivities = userActivities.filter(a => new Date(a.date) >= startOfMonth);
      
      recentActivities = userActivities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    }

    const dailyTotal = dailyActivities.reduce((sum, activity) => sum + activity.totalCO2, 0);
    const weeklyTotal = weeklyActivities.reduce((sum, activity) => sum + activity.totalCO2, 0);
    const monthlyTotal = monthlyActivities.reduce((sum, activity) => sum + activity.totalCO2, 0);

    // Generate chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      let dayActivities;
      try {
        dayActivities = await Activity.find({
          userId: req.user._id,
          date: { $gte: date, $lt: nextDay }
        });
      } catch (dbError) {
        const tempActivities = global.tempActivities || [];
        dayActivities = tempActivities.filter(a => {
          const activityDate = new Date(a.date);
          return a.userId == req.user._id && activityDate >= date && activityDate < nextDay;
        });
      }
      
      const dayTotal = dayActivities.reduce((sum, activity) => sum + activity.totalCO2, 0);
      
      chartData.push({
        date: date.toISOString().split('T')[0],
        co2: Math.round(dayTotal * 100) / 100
      });
    }

    // Generate personalized tips
    let tips = [];
    if (recentActivities.length > 0) {
      const latestActivity = recentActivities[0];
      tips = generateEcoTips({
        transport: latestActivity.transport,
        electricity: latestActivity.electricity,
        food: latestActivity.food
      }, latestActivity.totalCO2);
    } else {
      tips = ["Start logging your activities to get personalized eco-friendly tips!"];
    }

    // Check achievements
    const achievements = [];
    if (dailyTotal < user.goals.dailyTarget) {
      achievements.push({ name: "Daily Goal Achieved!", dateEarned: new Date() });
    }
    if (weeklyTotal < (user.goals.dailyTarget * 7)) {
      achievements.push({ name: "Weekly Goal Achieved!", dateEarned: new Date() });
    }

    res.json({
      user: {
        name: user.name,
        totalCarbonFootprint: user.totalCarbonFootprint,
        goals: user.goals
      },
      totals: {
        daily: Math.round(dailyTotal * 100) / 100,
        weekly: Math.round(weeklyTotal * 100) / 100,
        monthly: Math.round(monthlyTotal * 100) / 100
      },
      chartData,
      tips,
      achievements
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
