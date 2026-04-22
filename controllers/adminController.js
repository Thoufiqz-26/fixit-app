const Mechanic             = require('../models/Mechanic');
const User                 = require('../models/User');
const Booking              = require('../models/Booking');
const { signToken }        = require('../utils/jwt');
const logger               = require('../utils/logger');

/* ── POST /api/admin/login ── */
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ error: 'Phone and password required' });

    if (phone    !== process.env.ADMIN_PHONE    ||
        password !== process.env.ADMIN_PASSWORD)
      return res.status(401).json({ error: 'Invalid admin credentials' });

    const token = signToken({ role: 'admin', phone }, '24h');
    logger.warn(`🔐  Admin login  →  IP: ${req.ip}`);
    res.json({ token, message: 'Admin login successful' });

  } catch (err) {
    next(err);
  }
};

/* ── GET /api/admin/stats ── */
const getStats = async (req, res, next) => {
  try {
    const [
      total, active, verified, blocked, pendingVerification,
      totalUsers, totalBookings, bookingsByStatus, byService
    ] = await Promise.all([
      Mechanic.countDocuments(),
      Mechanic.countDocuments({ available: true, blocked: false }),
      Mechanic.countDocuments({ verified: true }),
      Mechanic.countDocuments({ blocked: true }),
      Mechanic.countDocuments({ verified: false, profileComplete: true, blocked: false }),
      User.countDocuments({ active: true }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Mechanic.aggregate([
        { $match: { profileComplete: true } },
        { $group: {
          _id:    '$service',
          count:  { $sum: 1 },
          active: { $sum: { $cond: ['$available', 1, 0] } }
        }},
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      mechanics: { total, active, verified, blocked, pendingVerification },
      totalUsers,
      totalBookings,
      bookingsByStatus: Object.fromEntries(bookingsByStatus.map(b => [b._id, b.count])),
      byService
    });

  } catch (err) {
    next(err);
  }
};

/* ── GET /api/admin/mechanics ── */
const getMechanics = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || 1));
    const limit  = Math.min(50, parseInt(req.query.limit || 20));
    const search = (req.query.search || '').trim();
    const filter = req.query.filter || 'all';

    const query = {};
    if (search) query.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { phone: { $regex: search } }
    ];
    if (filter === 'verified') { query.verified = true; query.blocked = false; }
    if (filter === 'pending')  { query.verified = false; query.profileComplete = true; query.blocked = false; }
    if (filter === 'blocked')  { query.blocked = true; }
    if (filter === 'active')   { query.available = true; query.blocked = false; }

    const [mechanics, total] = await Promise.all([
      Mechanic.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-__v'),
      Mechanic.countDocuments(query)
    ]);

    res.json({ mechanics, total, page, pages: Math.ceil(total / limit) });

  } catch (err) {
    next(err);
  }
};

/* ── PUT /api/admin/mechanics/:id/verify ── */
const toggleVerified = async (req, res, next) => {
  try {
    const m = await Mechanic.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Mechanic not found' });
    m.verified = !m.verified;
    await m.save();
    res.json({ verified: m.verified, name: m.name });
  } catch (err) {
    next(err);
  }
};

/* ── PUT /api/admin/mechanics/:id/block ── */
const toggleBlocked = async (req, res, next) => {
  try {
    const m = await Mechanic.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Mechanic not found' });
    m.blocked = !m.blocked;
    if (m.blocked) m.available = false; // force offline when blocked
    await m.save();
    res.json({ blocked: m.blocked, name: m.name });
  } catch (err) {
    next(err);
  }
};

/* ── PUT /api/admin/mechanics/:id ── */
const editMechanic = async (req, res, next) => {
  try {
    const allowed = ['name', 'service', 'exp', 'rating', 'tag', 'available', 'verified', 'blocked'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const m = await Mechanic.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!m) return res.status(404).json({ error: 'Mechanic not found' });
    res.json(m);
  } catch (err) {
    next(err);
  }
};

/* ── DELETE /api/admin/mechanics/:id ── */
const deleteMechanic = async (req, res, next) => {
  try {
    const m = await Mechanic.findByIdAndDelete(req.params.id);
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json({ message: `${m.name || 'Mechanic'} deleted` });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/admin/users ── */
const getUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || 1));
    const limit = Math.min(50, parseInt(req.query.limit || 20));
    const search = (req.query.search || '').trim();

    const query = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).select('-__v'),
      User.countDocuments(query)
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/admin/bookings ── */
const getBookings = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || 1));
    const limit  = Math.min(50, parseInt(req.query.limit || 20));
    const status = req.query.status || '';

    const query = status ? { status } : {};

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user',     'name email phone')
        .populate('mechanic', 'name phone service')
        .sort({ createdAt: -1 })
        .skip((page-1)*limit)
        .limit(limit),
      Booking.countDocuments(query)
    ]);

    res.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login, getStats,
  getMechanics, toggleVerified, toggleBlocked, editMechanic, deleteMechanic,
  getUsers, getBookings
};
