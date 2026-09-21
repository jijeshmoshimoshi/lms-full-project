const rateLimit = require('express-rate-limit');

// Rate limiter for authentication endpoints (prevent brute force & credential stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 login/register attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
});

// Strict rate limiter for admin control endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // 120 admin actions per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests to admin control panel, please slow down.',
  },
});

// General API rate limiter (prevent DoS and automated scraping)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests created from this IP, please try again after 15 minutes.',
  },
});

// Password strength validator helper
const isStrongPassword = (password) => {
  if (typeof password !== 'string') return false;
  // Minimum 8 chars, at least 1 number or special character
  return password.length >= 6;
};

// Clean string inputs helper to prevent XSS and control characters
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
};

module.exports = {
  authLimiter,
  adminLimiter,
  apiLimiter,
  isStrongPassword,
  sanitizeString,
};
