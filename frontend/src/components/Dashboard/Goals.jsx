import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Goals = () => {
  const [goals, setGoals] = useState({ dailyTarget: '', monthlyTarget: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const fetchGoals = async () => {
    try {
      const res = await axios.get('/api/goals');
      setGoals(res.data.goals || {});
    } catch (e) {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleChange = (field, value) => {
    setGoals(g => ({ ...g, [field]: value === '' ? '' : Number(value) }));
  };

  const saveGoals = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null); setError(null);
    try {
      await axios.put('/api/goals', {
        dailyTarget: goals.dailyTarget === '' ? undefined : goals.dailyTarget,
        monthlyTarget: goals.monthlyTarget === '' ? undefined : goals.monthlyTarget
      });
      setMsg('Goals updated');
    } catch (e2) {
      setError(e2.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading goals...</div>;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🎯</span> Goals
      </h2>
      {msg && <div className="mb-3 text-green-700 bg-green-100 p-2 rounded">{msg}</div>}
      {error && <div className="mb-3 text-red-700 bg-red-100 p-2 rounded">{error}</div>}
      <form onSubmit={saveGoals} className="space-y-4">
        <div>
          <label htmlFor="dailyTarget" className="block text-sm font-medium text-gray-700 mb-1">Daily Target (kg CO2)</label>
          <input id="dailyTarget" type="number" min="0" step="0.1" value={goals.dailyTarget}
            onChange={e=>handleChange('dailyTarget', e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label htmlFor="monthlyTarget" className="block text-sm font-medium text-gray-700 mb-1">Monthly Target (kg CO2)</label>
            <input id="monthlyTarget" type="number" min="0" step="1" value={goals.monthlyTarget}
              onChange={e=>handleChange('monthlyTarget', e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Goals'}</button>
      </form>
    </div>
  );
};

export default Goals;
