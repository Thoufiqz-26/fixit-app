const Booking              = require('../models/Booking');
const Mechanic             = require('../models/Mechanic');
const { validationResult } = require('express-validator');

/* ── POST /api/bookings — user creates a booking ── */
const createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { mechanicId, service, description, lat, lng, address, scheduledAt } = req.body;

    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic)         return res.status(404).json({ error: 'Mechanic not found' });
    if (!mechanic.available) return res.status(400).json({ error: 'Mechanic is currently unavailable' });
    if (mechanic.blocked)    return res.status(400).json({ error: 'Mechanic is not available' });

    const booking = await Booking.create({
      user:        req.user.id,
      mechanic:    mechanicId,
      service,
      description: (description || '').trim().slice(0, 500),
      userLocation: {
        type:        'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
        address:     (address || '').trim()
      },
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null
    });

    const populated = await Booking.findById(booking._id)
      .populate('mechanic', 'name phone service rating tag');

    res.status(201).json({ message: 'Booking created successfully', booking: populated });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/bookings/my — current user's bookings ── */
const getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('mechanic', 'name phone service rating tag verified')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/bookings/mechanic — mechanic's job list ── */
const getMechanicBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { mechanic: req.user.id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

/* ── PUT /api/bookings/:id/status — mechanic updates status ── */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['accepted', 'in_progress', 'completed', 'cancelled'];
    if (!allowed.includes(status))
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isMechanic = booking.mechanic.toString() === req.user.id;
    const isAdmin    = req.user.role === 'admin';
    if (!isMechanic && !isAdmin)
      return res.status(403).json({ error: 'Not authorized to update this booking' });

    booking.status = status;
    if (status === 'accepted')   booking.acceptedAt  = new Date();
    if (status === 'completed')  booking.completedAt = new Date();
    await booking.save();

    res.json({ message: `Booking marked as ${status}`, booking });
  } catch (err) {
    next(err);
  }
};

/* ── POST /api/bookings/:id/rate — user rates a completed booking ── */
const rateBooking = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const ratingNum = parseInt(rating);

    if (!ratingNum || ratingNum < 1 || ratingNum > 5)
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.user.toString() !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });
    if (booking.status !== 'completed')
      return res.status(400).json({ error: 'Can only rate completed bookings' });
    if (booking.rating)
      return res.status(409).json({ error: 'You have already rated this booking' });

    booking.rating = ratingNum;
    booking.review = (review || '').trim().slice(0, 300);
    await booking.save();

    // Recalculate mechanic's average rating
    const mechanic = await Mechanic.findById(booking.mechanic);
    if (mechanic) {
      const newCount  = mechanic.ratingCount + 1;
      const newRating = ((mechanic.rating * mechanic.ratingCount) + ratingNum) / newCount;
      await Mechanic.findByIdAndUpdate(booking.mechanic, {
        rating:      Math.round(newRating * 10) / 10,
        ratingCount: newCount
      });
    }

    res.json({ message: 'Rating submitted. Thank you!', booking });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getMechanicBookings,
  updateBookingStatus,
  rateBooking
};
