import React from 'react';

const EcoTips = ({ tips }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">💡</span>
        Eco-Friendly Tips
      </h2>
      
      <div className="space-y-3">
        {tips.map((tip, index) => (
          <div key={index} className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
            <p className="text-sm text-green-800">{tip}</p>
          </div>
        ))}
      </div>
      
      {tips.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          Start logging activities to get personalized tips!
        </p>
      )}
    </div>
  );
};

export default EcoTips;
