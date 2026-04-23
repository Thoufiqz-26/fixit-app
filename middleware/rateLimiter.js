const rateLimit = require('express-rate-limit');

/** General API — 100 req / 15 min */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' }
});

/** Auth endpoints — 20 req / 15 min */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please wait before trying again.' }
});

/** OTP send — limit per phone number, not IP */
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // ✅ Key by phone number instead of IP
  keyGenerator: (req) => req.body.phone || req.body.email || req.ip,
  message: { error: 'Too many OTP requests. Try again in 1 hour.' }
});

module.exports = { generalLimiter, authLimiter, otpLimiter };
