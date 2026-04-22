const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const { sendOtp, verifyOtp } = require('../controllers/authController');
const { otpLimiter }         = require('../middleware/rateLimiter');

// POST /api/auth/otp/send
router.post('/otp/send', otpLimiter, [
  body('phone').notEmpty().withMessage('Phone number is required')
], sendOtp);

// POST /api/auth/otp/verify
router.post('/otp/verify', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits')
], verifyOtp);

module.exports = router;
