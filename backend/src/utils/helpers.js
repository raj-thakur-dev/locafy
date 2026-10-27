const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'locafy_super_secret_jwt_key_2026_change_in_production';

/**
 * Hash password with bcrypt
 */
async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compare plain password against hash
 */
async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Generate JWT token
 */
function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

/**
 * Determine if a business is currently open in Asia/Kolkata timezone (IST: UTC + 5:30)
 * openingHours format: {
 *   "monday": { "open": "09:00", "close": "22:00", "closed": false }, ...
 * }
 */
function isOpenNow(openingHoursJson) {
  try {
    let hours = openingHoursJson;
    if (typeof hours === 'string') {
      hours = JSON.parse(hours || '{}');
    }
    if (!hours || Object.keys(hours).length === 0) return true; // Default to open if not configured

    // Current time in IST (Asia/Kolkata)
    const now = new Date();
    // UTC time in ms + 5.5 hours
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + 5.5 * 3600000);

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[istTime.getDay()];
    const todaySchedule = hours[currentDay];

    if (!todaySchedule || todaySchedule.closed) return false;
    if (!todaySchedule.open || !todaySchedule.close) return true;

    const currentMinutes = istTime.getHours() * 60 + istTime.getMinutes();

    const [openH, openM] = todaySchedule.open.split(':').map(Number);
    const [closeH, closeM] = todaySchedule.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    let closeMinutes = closeH * 60 + closeM;

    // Handle overnight hours (e.g. 18:00 to 02:00)
    if (closeMinutes < openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } catch (err) {
    return false;
  }
}

/**
 * Standard error formatter
 */
function formatError(code, message) {
  return { error: { code, message } };
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  calculateDistanceKm,
  isOpenNow,
  formatError
};
