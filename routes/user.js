const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const { authLimiter } = require('../middleware/rateLimiter');
const { userAuth }    = require('../middleware/auth');
const { register, login, getProfile, updateProfile } = require('../controllers/userController');

// POST /api/user/register
router.post('/register', authLimiter, [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register);

// POST /api/user/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

// GET /api/user/me
router.get('/me', userAuth, getProfile);

// PUT /api/user/me
router.put('/me', userAuth, updateProfile);

module.exports = router;
