
import React from 'react';

const Achievements = ({ achievements }) => {
  const achievementIcons = {
    'Daily Goal Achieved!': '🎯',
    'Weekly Goal Achieved!': '🏆',
    'Monthly Goal Achieved!': '👑',
    'First Activity Logged': '🌱',
    'Eco Warrior': '🌍'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🏅</span>
        Achievements
      </h2>
      
      <div className="space-y-3">
        {achievements.map((achievement, index) => (
          <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <span className="text-2xl mr-3">
              {achievementIcons[achievement.name] || '🏅'}
            </span>
            <div>
              <p className="font-medium text-gray-900">{achievement.name}</p>
              <p className="text-sm text-gray-600">
                {new Date(achievement.dateEarned).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {achievements.length === 0 && (
        <div className="text-center py-8">
          <span className="text-6xl mb-4 block">🎯</span>
          <p className="text-gray-500">No achievements yet</p>
          <p className="text-sm text-gray-400">Start logging activities to earn achievements!</p>
        </div>
      )}
    </div>
  );
};

export default Achievements;
