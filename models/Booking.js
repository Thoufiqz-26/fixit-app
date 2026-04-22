const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true, index: true },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'Mechanic', required: true, index: true },

    service: {
      type: String,
      enum: ['bike', 'car', 'elec', 'plumb', 'ac', 'wash'],
      required: true
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },

    description: { type: String, default: '', maxlength: 500 },

    userLocation: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      address:     { type: String, default: '' }
    },

    scheduledAt:  { type: Date, default: null },
    acceptedAt:   { type: Date },
    completedAt:  { type: Date },

    // Rating given by user after completion
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, default: '', maxlength: 300 },

    price: { type: Number, default: 0 }
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ mechanic: 1, status: 1 });
bookingSchema.index({ 'userLocation': '2dsphere' });

module.exports = mongoose.model('Booking', bookingSchema);
