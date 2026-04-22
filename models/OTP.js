const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone:     { type: String, required: true, index: true },
  otp:       { type: String, required: true },
  expiresAt: { type: Date,   required: true },
  verified:  { type: Boolean, default: false }
});

// TTL index — MongoDB auto-deletes expired OTP docs after 10 min
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model('OTP', otpSchema);
