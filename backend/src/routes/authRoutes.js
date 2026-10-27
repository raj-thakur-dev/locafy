const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { register, login, logout, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validation');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login/registration attempts, please try again later.' } }
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticateToken(false), getMe);

module.exports = router;
