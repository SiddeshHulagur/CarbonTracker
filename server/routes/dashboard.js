
import express from 'express';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import CarbonScore from '../models/CarbonScore.js';
import { generateEcoTips } from '../utils/carbonCalculator.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard data
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get recent activities for tips
    const recentActivities = await Activity.find({
      userId: req.user._id
    }).sort({ date: -1 }).limit(5);

    // Calculate period totals
    const now = new Date();
    
    // Daily total
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const dailyActivities = await Activity.find({
      userId: req.user._id,
      date: { $gte: startOfDay }
    });
    const dailyTotal = dailyActivities.reduce((sum, activity) => sum + activity.totalCO2, 0);

    // Weekly total
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const weeklyActivities = await Activity.find({
      userId: req.user._id,
      date: { $gte: startOfWeek }
    });
    const weeklyTotal = weeklyActivities.reduce((sum, activity) => sum + activity.totalCO2, 0);

    // Monthly total
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyActivities = await Activity.find({
      userId: req.user._id,
      date: { $gte: startOfMonth }
    });
    const monthlyTotal = monthlyActivities.reduce((sum, activity) => sum + activity.totalCO2, 0);

    // Generate chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      const dayActivities = await Activity.find({
        userId: req.user._id,
        date: { $gte: date, $lt: nextDay }
      });
      
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
