import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EmissionsChart from './EmissionsChart.jsx';
import StatsCards from './StatsCards.jsx';
import EcoTips from './EcoTips.jsx';
import Achievements from './Achievements.jsx';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {dashboardData?.user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's your carbon footprint overview
        </p>
      </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats Cards */}
        <div className="lg:col-span-2">
          <StatsCards data={dashboardData} />
        </div>

        {/* Achievements */}
        <div>
          <Achievements achievements={dashboardData?.achievements || []} />
        </div>

        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Weekly Emissions Trend
            </h2>
            <EmissionsChart data={dashboardData?.chartData || []} />
          </div>
        </div>

        {/* Breakdown & Streak */}
        <div className="space-y-6">
          <EcoTips tips={dashboardData?.tips || []} />
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center"><span className="mr-2">🪩</span>Latest Activity Breakdown</h2>
            {dashboardData?.breakdown?.raw ? (
              <ul className="text-sm text-gray-700 space-y-1">
                {Object.entries(dashboardData.breakdown.raw).map(([k,v]) => (
                  <li key={k} className="flex justify-between"><span className="capitalize">{k}</span><span>{v} kg ({dashboardData.breakdown.percent[k]}%)</span></li>
                ))}
              </ul>
            ) : <p className="text-gray-500 text-sm">Log an activity to see details.</p>}
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center"><span className="mr-2">🔥</span>Low-Emission Streak</h2>
            <p className="text-3xl font-bold text-green-600">{dashboardData?.streak || 0} day(s)</p>
            <p className="text-xs text-gray-500 mt-1">Counts consecutive days meeting or improving vs previous day within goal.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
