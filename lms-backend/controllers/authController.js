const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isStrongPassword, sanitizeString } = require('../middleware/security');
const { sendWelcomeEmail } = require('../services/emailService');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Strict input type validation to prevent NoSQL injection & type manipulation
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      return res.status(400).json({ message: 'Name, email, and password must be valid strings.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = sanitizeString(name);

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password,
      role: role === 'instructor' ? 'instructor' : 'student', // Admins are NEVER self-assignable
      isVerified: role === 'instructor' ? false : true,
    });

    // Send Welcome Email asynchronously (non-blocking)
    sendWelcomeEmail({
      studentEmail: user.email,
      studentName: user.name,
      role: user.role,
    }).catch((err) => console.error('[EmailService] Welcome email send error:', err.message));

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed due to a server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid email or password format' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: { 
        id: user._id, 
        _id: user._id,
        name: user.name, 
        email: user.email, 
        role: user.role, 
        isVerified: user.isVerified,
        headline: user.headline || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Authentication failed due to a server error' });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, headline, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name.trim();
    if (headline !== undefined) user.headline = headline.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        headline: user.headline || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
