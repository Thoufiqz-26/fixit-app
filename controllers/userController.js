const User                 = require('../models/User');
const { signToken }        = require('../utils/jwt');
const { validationResult } = require('express-validator');

/* ── POST /api/user/register ── */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user  = await User.create({ name, email, password, phone });
    const token = signToken({ id: user._id, role: user.role, email });

    res.status(201).json({
      token,
      user: _safe(user)
    });
  } catch (err) {
    next(err);
  }
};

/* ── POST /api/user/login ── */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.active) return res.status(403).json({ error: 'Account disabled. Contact support.' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = signToken({ id: user._id, role: user.role, email });
    res.json({ token, user: _safe(user) });

  } catch (err) {
    next(err);
  }
};

/* ── GET /api/user/me ── */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/* ── PUT /api/user/me ── */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const allowed = {};
    if (name)  allowed.name  = name.trim();
    if (phone) allowed.phone = phone.trim();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      allowed,
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    next(err);
  }
};

/** Strip sensitive fields from user document */
function _safe(u) {
  return { id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role };
}

module.exports = { register, login, getProfile, updateProfile };
