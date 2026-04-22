const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const { userAuth, mechanicAuth } = require('../middleware/auth');
const {
  createBooking, getUserBookings, getMechanicBookings,
  updateBookingStatus, rateBooking
} = require('../controllers/bookingController');

// User creates a booking
router.post('/', userAuth, [
  body('mechanicId').notEmpty().withMessage('mechanicId is required'),
  body('service').isIn(['bike','car','elec','plumb','ac','wash']).withMessage('Invalid service')
], createBooking);

// User's own booking history
router.get('/my',       userAuth,     getUserBookings);

// Mechanic's job inbox
router.get('/mechanic', mechanicAuth, getMechanicBookings);

// Mechanic updates booking status
router.put('/:id/status', mechanicAuth, [
  body('status').isIn(['accepted','in_progress','completed','cancelled']).withMessage('Invalid status')
], updateBookingStatus);

// User rates a completed booking
router.post('/:id/rate', userAuth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5')
], rateBooking);

module.exports = router;
