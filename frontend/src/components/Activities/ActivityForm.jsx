import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ActivityForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    transport: {
      carKm: '',
      bikeKm: '',
      busKm: '',
      walkKm: ''
    },
    electricity: {
      kwhUsed: ''
    },
    food: {
      meat: '',
      dairy: '',
      vegetables: '',
      processed: ''
    }
  });

  const handleInputChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value === '' ? 0 : parseFloat(value) || 0
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/activities', formData);
      setSuccess(`Activity logged successfully! CO2 impact: ${response.data.totalCO2} kg`);
      
      // Reset form
      setFormData({
        transport: { carKm: '', bikeKm: '', busKm: '', walkKm: '' },
        electricity: { kwhUsed: '' },
        food: { meat: '', dairy: '', vegetables: '', processed: '' }
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Log Your Daily Activities</h1>
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Transport Section */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🚗</span>
              Transportation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Car (km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.transport.carKm}
                  onChange={(e) => handleInputChange('transport', 'carKm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bike (km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.transport.bikeKm}
                  onChange={(e) => handleInputChange('transport', 'bikeKm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bus/Public Transport (km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.transport.busKm}
                  onChange={(e) => handleInputChange('transport', 'busKm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Walking (km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.transport.walkKm}
                  onChange={(e) => handleInputChange('transport', 'walkKm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Electricity Section */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Electricity Usage
            </h2>
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Electricity Used (kWh)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.electricity.kwhUsed}
                onChange={(e) => handleInputChange('electricity', 'kwhUsed', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Food Section */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🍽️</span>
              Food Consumption
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meat (servings)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.food.meat}
                  onChange={(e) => handleInputChange('food', 'meat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dairy (servings)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.food.dairy}
                  onChange={(e) => handleInputChange('food', 'dairy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vegetables (servings)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.food.vegetables}
                  onChange={(e) => handleInputChange('food', 'vegetables', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processed Food (servings)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.food.processed}
                  onChange={(e) => handleInputChange('food', 'processed', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-md text-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Logging Activity...' : 'Log Activity'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivityForm;
