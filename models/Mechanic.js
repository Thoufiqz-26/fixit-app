const mongoose = require('mongoose');

const mechanicSchema = new mongoose.Schema(
  {
    phone: { type: String, unique: true, required: true, index: true },
    name:  { type: String, trim: true, default: '' },
    service: {
      type: String,
      enum: ['bike', 'car', 'elec', 'plumb', 'ac', 'wash'],
      default: null
    },
    exp:  { type: String, default: '' },
    bio:  { type: String, default: '', maxlength: 500 },

    rating:      { type: Number, default: 4.5, min: 1, max: 5 },
    ratingCount: { type: Number, default: 0 },
    tag:         { type: String, default: 'New' },

    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },

    available:       { type: Boolean, default: true },
    verified:        { type: Boolean, default: false },
    blocked:         { type: Boolean, default: false },
    profileComplete: { type: Boolean, default: false },

    role:     { type: String, enum: ['mechanic', 'admin'], default: 'mechanic' },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Geospatial + compound query indexes
mechanicSchema.index({ location: '2dsphere' });
mechanicSchema.index({ service: 1, available: 1, verified: 1, blocked: 1 });

module.exports = mongoose.model('Mechanic', mechanicSchema);
