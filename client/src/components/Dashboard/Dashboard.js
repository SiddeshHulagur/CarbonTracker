
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EmissionsChart from './EmissionsChart';
import StatsCards from './StatsCards';
import EcoTips from './EcoTips';
import Achievements from './Achievements';

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

        {/* Eco Tips */}
        <div>
          <EcoTips tips={dashboardData?.tips || []} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
