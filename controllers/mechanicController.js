const Mechanic          = require('../models/Mechanic');
const { validationResult } = require('express-validator');

/* ── Save / update mechanic profile ── */
const saveProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { name, service, exp, bio, rating, tag, lat, lng } = req.body;

    const updated = await Mechanic.findByIdAndUpdate(
      req.user.id,
      {
        name:    name.trim(),
        service,
        exp:     exp.trim(),
        bio:     (bio || '').trim().slice(0, 500),
        rating:  Math.min(5, Math.max(1, parseFloat(rating) || 4.5)),
        tag:     tag || 'New',
        profileComplete: true,
        location: {
          type:        'Point',
          coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0]
        }
      },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updated) return res.status(404).json({ error: 'Mechanic not found' });
    res.json({ message: 'Profile saved', mechanic: updated });

  } catch (err) {
    next(err);
  }
};

/* ── Get own profile ── */
const getProfile = async (req, res, next) => {
  try {
    const m = await Mechanic.findById(req.user.id).select('-__v');
    if (!m) return res.status(404).json({ error: 'Mechanic not found' });
    res.json(m);
  } catch (err) {
    next(err);
  }
};

/* ── Toggle online / offline ── */
const toggleAvailability = async (req, res, next) => {
  try {
    const m = await Mechanic.findById(req.user.id);
    if (!m) return res.status(404).json({ error: 'Mechanic not found' });

    m.available = !m.available;
    m.lastSeen  = new Date();
    await m.save();

    res.json({
      available: m.available,
      message:   m.available ? 'You are now Online' : 'You are now Offline'
    });
  } catch (err) {
    next(err);
  }
};

/* ── Update live location ── */
const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null)
      return res.status(400).json({ error: 'lat and lng are required' });

    await Mechanic.findByIdAndUpdate(req.user.id, {
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      lastSeen: new Date()
    });

    res.json({ message: 'Location updated' });
  } catch (err) {
    next(err);
  }
};

/* ── Delete account ── */
const deleteAccount = async (req, res, next) => {
  try {
    await Mechanic.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/* ── Search nearby (public) ── */
const searchNearby = async (req, res, next) => {
  try {
    const { lat, lng, service, maxDistance = 10000 } = req.body;

    if (lat == null || lng == null || !service)
      return res.status(400).json({ error: 'lat, lng, and service are required' });

    const matchQuery = {
      available:       true,
      verified:        true,
      blocked:         false,
      profileComplete: true
    };
    if (service !== 'all') matchQuery.service = service;

    const results = await Mechanic.aggregate([
      {
        $geoNear: {
          near:          { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: 'distance',
          maxDistance:   parseInt(maxDistance),
          spherical:     true,
          query:         matchQuery
        }
      },
      { $limit: 20 },
      { $project: { __v: 0 } }
    ]);

    res.json(results);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  saveProfile,
  getProfile,
  toggleAvailability,
  updateLocation,
  deleteAccount,
  searchNearby
};
