import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/leaderboard?period=${period}`);
        if (isMounted) {
          setLeaderboardData(response.data);
          setError('');
        }
      } catch (error) {
        if (isMounted) setError('Failed to load leaderboard data');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [period]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 border-yellow-300';
      case 2: return 'bg-gray-100 border-gray-300';
      case 3: return 'bg-orange-100 border-orange-300';
      default: return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <span className="mr-2">🏆</span>
            Leaderboard
          </h1>
          
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {leaderboardData && (
          <>
            {/* Current User Position */}
            {leaderboardData.currentUser && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Position</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getRankIcon(leaderboardData.currentUser.rank)}</span>
                    <div>
                      <p className="font-medium">{leaderboardData.currentUser.name}</p>
                      <p className="text-sm text-gray-600">Rank #{leaderboardData.currentUser.rank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {leaderboardData.currentUser.totalEmissions} kg CO2
                    </p>
                    <p className="text-sm text-gray-600">
                      {period === 'week' ? 'This Week' : 'This Month'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Top 10 Leaderboard */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Top Eco-Friendly Users ({period === 'week' ? 'This Week' : 'This Month'})
              </h2>
              
              {leaderboardData.leaderboard.map((user, index) => (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg border-2 ${getRankColor(user.rank)} transition-all hover:shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-4">{getRankIcon(user.rank)}</span>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">Rank #{user.rank}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {user.totalEmissions} kg CO2
                      </p>
                      <p className="text-sm text-green-600">
                        {user.totalEmissions === 0 ? 'Perfect Score!' : 'Low Impact'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {leaderboardData.leaderboard.length === 0 && (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">🌱</span>
                  <p className="text-gray-500 text-lg">No data available yet</p>
                  <p className="text-gray-400">Start logging activities to appear on the leaderboard!</p>
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">🌍 How it works</h3>
              <p className="text-sm text-green-700">
                Lower emissions = better ranking! The leaderboard celebrates users who maintain 
                the smallest carbon footprint. Keep logging your activities and make eco-friendly 
                choices to climb the rankings.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
