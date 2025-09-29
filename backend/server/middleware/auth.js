
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Try MongoDB first, fallback to temp storage
    let user;
    try {
      user = await User.findById(decoded.userId);
    } catch (dbError) {
      console.log('MongoDB not available for auth, checking temp storage');
      // Access global temp storage
      user = global.tempUsers?.find(u => u._id === decoded.userId);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
