const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// Rate limiting on public auth endpoints
const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 50, message: 'Too many authentication attempts. Please try again after 15 minutes.' });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
