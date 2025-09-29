import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import crypto from 'crypto';
import PasswordResetToken from '../models/PasswordResetToken.js';

const SKIP_DB = process.env.NODE_ENV === 'test';

// Temporary in-memory storage when MongoDB is not available
let tempUsers = [];
let tempActivities = [];
let tempUserIdCounter = 1;

// Make temp storage globally accessible
global.tempUsers = tempUsers;
global.tempActivities = tempActivities;

const router = express.Router();

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Try MongoDB first, fallback to in-memory storage
    let existingUser, user;
    try {
      if (SKIP_DB) throw new Error('Skip DB in test');
      existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      user = new User({ name, email, password: hashedPassword });
      await user.save();
    } catch (dbError) {
      console.log('MongoDB not available, using temporary storage');
      
      // Check if user exists in temp storage
      existingUser = tempUsers.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user in temp storage
      user = {
        _id: tempUserIdCounter++,
        name,
        email,
        password: hashedPassword
      };
      
      tempUsers.push(user);
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Try MongoDB first, fallback to in-memory storage
    let user;
    try {
      if (SKIP_DB) throw new Error('Skip DB in test');
      user = await User.findOne({ email });
    } catch (dbError) {
      console.log('MongoDB not available, using temporary storage');
      user = tempUsers.find(u => u.email === email);
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

export default router;
// Request password reset
router.post('/request-password-reset', [body('email').isEmail()], async (req,res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email } = req.body;
    let user;
    try {
      if (SKIP_DB) throw new Error('Skip DB in test');
      user = await User.findOne({ email });
    } catch (e) {
      user = tempUsers.find(u=>u.email===email);
    }
    if (!user) return res.status(200).json({ message: 'If that email exists, a reset link was sent.' });
    const tokenValue = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000*60*30); // 30 min
    try {
      if (SKIP_DB) throw new Error('Skip DB in test');
      await PasswordResetToken.deleteMany({ userId: user._id });
      await PasswordResetToken.create({ userId: user._id, token: tokenValue, expiresAt });
    } catch (e) {
      // fallback: store in memory
      global.tempPasswordTokens = global.tempPasswordTokens || [];
      global.tempPasswordTokens = global.tempPasswordTokens.filter(t=>t.userId !== user._id);
      global.tempPasswordTokens.push({ userId: user._id, token: tokenValue, expiresAt });
    }
    // Simulate email send by returning token ONLY in non-production for demo
    const demoToken = process.env.NODE_ENV !== 'production' ? tokenValue : undefined;
    res.json({ message: 'Password reset requested. Use the provided token to reset.', token: demoToken });
  } catch (e) {
    console.error('Password reset request error', e);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Confirm password reset
router.post('/reset-password', [
  body('token').isString().notEmpty(),
  body('password').isLength({ min: 6 })
], async (req,res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { token, password } = req.body;
    let record;
    try {
      if (SKIP_DB) throw new Error('Skip DB in test');
      record = await PasswordResetToken.findOne({ token });
    } catch (e) {
      record = (global.tempPasswordTokens||[]).find(t=>t.token===token);
    }
    if (!record || record.expiresAt < new Date()) return res.status(400).json({ error: 'Invalid or expired token' });
    let user;
    try {
      if (SKIP_DB) throw new Error('Skip DB in test');
      user = await User.findById(record.userId);
    } catch (e) {
      user = tempUsers.find(u=>u._id === record.userId);
    }
    if (!user) return res.status(400).json({ error: 'User not found' });
    const hashed = await bcrypt.hash(password, 12);
    try {
      if (!SKIP_DB && user.save) {
        user.password = hashed;
        await user.save();
      } else {
        user.password = hashed; // in-memory path
      }
      if (!SKIP_DB && PasswordResetToken.deleteMany) await PasswordResetToken.deleteMany({ userId: user._id });
    } catch (e) {
      global.tempPasswordTokens = (global.tempPasswordTokens||[]).filter(t=>t.userId !== user._id);
    }
    res.json({ message: 'Password updated successfully' });
  } catch (e) {
    console.error('Password reset error', e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});