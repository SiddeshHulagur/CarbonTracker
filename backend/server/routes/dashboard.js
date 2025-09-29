
import express from 'express';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { generateEcoTips, categoryBreakdown, EMISSION_FACTORS_META } from '../utils/carbonCalculator.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const SKIP_DB = process.env.NODE_ENV === 'test';

// Get dashboard data
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
  let activities, totalActivities, todayTotal, weekTotal, weekAvg, monthTotal, allTimeTotal;
  let achievements = req.user.achievements || [];

    try {
      if (SKIP_DB) throw new Error('Skip DB in test');
      // Try MongoDB first
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      activities = await Activity.find({ userId }).sort({ date: -1 }).limit(14); // 2 weeks for chart context
      totalActivities = await Activity.countDocuments({ userId });

      const todayData = await Activity.find({ userId, date: { $gte: startOfToday } });
      todayTotal = todayData.reduce((s,a)=>s+a.totalCO2,0);

      const weekData = await Activity.find({ userId, date: { $gte: startOfWeek } });
      weekTotal = weekData.reduce((s,a)=>s+a.totalCO2,0);
      weekAvg = weekTotal / 7;

      const monthData = await Activity.find({ userId, date: { $gte: startOfMonth } });
      monthTotal = monthData.reduce((s,a)=>s+a.totalCO2,0);

      const allTimeData = await Activity.find({ userId });
      allTimeTotal = allTimeData.reduce((s,a)=>s+a.totalCO2,0);

    } catch (dbError) {
      console.log('MongoDB not available, using temp storage');
      
      // Fallback to temp storage
      const userActivities = global.tempActivities?.filter(a => a.userId === userId) || [];
      
      // Sort by date (newest first) and limit to 10
      activities = userActivities.sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,14);
      totalActivities = userActivities.length;

      const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
      const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate()-7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayData = userActivities.filter(a => new Date(a.date) >= startOfToday);
      todayTotal = todayData.reduce((s,a)=>s+a.totalCO2,0);

      const weekData = userActivities.filter(a => new Date(a.date) >= startOfWeek);
      weekTotal = weekData.reduce((s,a)=>s+a.totalCO2,0);
      weekAvg = weekTotal / 7;

      const monthData = userActivities.filter(a => new Date(a.date) >= startOfMonth);
      monthTotal = monthData.reduce((s,a)=>s+a.totalCO2,0);
      allTimeTotal = userActivities.reduce((s,a)=>s+a.totalCO2,0);
    }

    // Achievement awarding (simple examples)
    const newlyEarned = [];
    const hasAchievement = name => achievements.some(a=>a.name===name);
    if (totalActivities === 1 && !hasAchievement('First Activity Logged')) {
      newlyEarned.push({ name:'First Activity Logged', dateEarned: new Date() });
    }
    if (req.user.goals?.dailyTarget && todayTotal <= req.user.goals.dailyTarget && todayTotal > 0 && !hasAchievement('Daily Goal Achieved!')) {
      newlyEarned.push({ name:'Daily Goal Achieved!', dateEarned: new Date() });
    }
    // Persist achievements if DB available
    if (newlyEarned.length) {
      achievements = [...achievements, ...newlyEarned];
      try {
        if (!SKIP_DB) {
          const userDoc = await User.findById(userId);
          if (userDoc) {
            userDoc.achievements = achievements;
            await userDoc.save();
          } else {
            req.user.achievements = achievements;
          }
        } else {
          req.user.achievements = achievements;
        }
      } catch (err) {
        req.user.achievements = achievements; // in-memory fallback
      }
    }

    const tips = activities.length ? generateEcoTips(activities[0], activities[0].totalCO2) : ['Start logging your activities to get personalized eco tips!'];

    const chartSeries = [...activities].reverse().map(a=>({ date: a.date, co2: a.totalCO2 }));

    // Last logged activity breakdown
    const latest = activities[0];
    const breakdown = latest ? categoryBreakdown(latest) : { raw:{}, percent:{} };

    // Simple daily low-emission streak calculation (<= daily goal or below previous day) over last 14 days
    let streak = 0;
    let prevDay = null;
    const dayMap = {};
    activities.forEach(a => {
      const key = new Date(a.date).toISOString().slice(0,10);
      dayMap[key] = (dayMap[key]||0) + a.totalCO2;
    });
    const today = new Date();
    for (let i=0; i<14; i++) {
      const d = new Date(today); d.setDate(today.getDate()-i);
      const key = d.toISOString().slice(0,10);
      if (!(key in dayMap)) break;
      const val = dayMap[key];
      if (req.user.goals?.dailyTarget && val > req.user.goals.dailyTarget) break;
      if (prevDay !== null && val > prevDay) break; // increasing day stops streak
      streak++;
      prevDay = val;
    }

    res.json({
      totals: {
        daily: Number(todayTotal?.toFixed(2) || 0),
        weekly: Number(weekTotal?.toFixed(2) || 0),
        weeklyAverage: Number(weekAvg?.toFixed(2) || 0),
        monthly: Number(monthTotal?.toFixed(2) || 0),
        allTime: Number(allTimeTotal?.toFixed(2) || 0)
      },
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        totalCarbonFootprint: Number(allTimeTotal?.toFixed(2) || 0),
        goals: req.user.goals
      },
      achievements,
      recentActivities: activities.slice(0,10).map(a=>({
        id: a._id,
        date: a.date,
        totalCO2: a.totalCO2,
        transport: a.transport,
        electricity: a.electricity,
        food: a.food
      })),
      tips,
      chartData: chartSeries,
      breakdown,
      streak,
      emissionFactors: EMISSION_FACTORS_META
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// CSV export of all user activities
router.get('/export', auth, async (req, res) => {
  try {
    let activities = [];
    try {
      activities = await Activity.find({ userId: req.user._id }).sort({ date: 1 });
    } catch (e) {
      activities = (global.tempActivities||[]).filter(a=>a.userId === req.user._id).sort((a,b)=> new Date(a.date)-new Date(b.date));
    }
    const header = ['date','totalCO2','carKm','busKm','bikeKm','walkKm','kwhUsed','meat','dairy','vegetables','processed'];
    const rows = activities.map(a => [
      new Date(a.date).toISOString(),
      a.totalCO2,
      a.transport?.carKm||0,
      a.transport?.busKm||0,
      a.transport?.bikeKm||0,
      a.transport?.walkKm||0,
      a.electricity?.kwhUsed||0,
      a.food?.meat||0,
      a.food?.dairy||0,
      a.food?.vegetables||0,
      a.food?.processed||0
    ]);
    const csv = [header.join(','), ...rows.map(r=>r.join(','))].join('\n');
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="activities.csv"');
    res.send(csv);
  } catch (e) {
    console.error('Export error', e);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;

