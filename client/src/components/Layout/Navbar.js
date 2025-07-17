
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🌱</span>
            <span className="text-xl font-bold text-green-600">Carbon Tracker</span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-6">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/log-activity"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/log-activity')
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Log Activity
              </Link>
              <Link
                to="/leaderboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/leaderboard')
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Leaderboard
              </Link>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Hello, {user.name}</span>
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
