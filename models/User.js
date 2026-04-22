const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true, index: true
    },
    password: {
      type: String, required: true,
      minlength: 6,
      select: false  // never returned in queries by default
    },
    phone:     { type: String, default: '' },
    role:      { type: String, enum: ['user'], default: 'user' },
    active:    { type: Boolean, default: true },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

// ── Hash password before every save ──
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Compare plain-text vs stored hash ──
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
