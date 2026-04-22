const express  = require('express');
const router   = express.Router();
const { adminAuth }   = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  login, getStats,
  getMechanics, toggleVerified, toggleBlocked, editMechanic, deleteMechanic,
  getUsers, getBookings
} = require('../controllers/adminController');

router.post('/login',   authLimiter, login);
router.get('/stats',    adminAuth,   getStats);

// Mechanics management
router.get   ('/mechanics',            adminAuth, getMechanics);
router.put   ('/mechanics/:id/verify', adminAuth, toggleVerified);
router.put   ('/mechanics/:id/block',  adminAuth, toggleBlocked);
router.put   ('/mechanics/:id',        adminAuth, editMechanic);
router.delete('/mechanics/:id',        adminAuth, deleteMechanic);

// Users & Bookings (read-only admin views)
router.get('/users',    adminAuth, getUsers);
router.get('/bookings', adminAuth, getBookings);

module.exports = router;
