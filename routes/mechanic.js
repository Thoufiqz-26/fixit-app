const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const { mechanicAuth } = require('../middleware/auth');
const {
  saveProfile, getProfile, toggleAvailability,
  updateLocation, deleteAccount, searchNearby
} = require('../controllers/mechanicController');

// ── Authenticated mechanic endpoints ──────────────────────
router.get('/me',           mechanicAuth, getProfile);
router.put('/availability', mechanicAuth, toggleAvailability);
router.put('/location',     mechanicAuth, updateLocation);
router.delete('/',          mechanicAuth, deleteAccount);

router.post('/profile', mechanicAuth, [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('service').isIn(['bike','car','elec','plumb','ac','wash']).withMessage('Invalid service type'),
  body('exp').notEmpty().trim().withMessage('Experience is required')
], saveProfile);

// ── Public search ─────────────────────────────────────────
router.post('/nearby', searchNearby);

module.exports = router;
