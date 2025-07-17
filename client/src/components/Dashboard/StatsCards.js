
import React from 'react';

const StatsCards = ({ data }) => {
  const stats = [
    {
      title: 'Today',
      value: `${data?.totals?.daily || 0} kg`,
      color: 'bg-blue-500',
      icon: '📅'
    },
    {
      title: 'This Week',
      value: `${data?.totals?.weekly || 0} kg`,
      color: 'bg-green-500',
      icon: '📊'
    },
    {
      title: 'This Month',
      value: `${data?.totals?.monthly || 0} kg`,
      color: 'bg-purple-500',
      icon: '📈'
    },
    {
      title: 'Total Footprint',
      value: `${data?.user?.totalCarbonFootprint || 0} kg`,
      color: 'bg-red-500',
      icon: '🌍'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-3 rounded-full text-white text-xl`}>
              {stat.icon}
            </div>
          </div>
          
          {/* Goal Progress */}
          {stat.title === 'Today' && data?.user?.goals?.dailyTarget && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Daily Goal</span>
                <span>{data.user.goals.dailyTarget} kg</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    (data.totals.daily || 0) <= data.user.goals.dailyTarget
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      ((data.totals.daily || 0) / data.user.goals.dailyTarget) * 100,
                      100
                    )}%`
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
