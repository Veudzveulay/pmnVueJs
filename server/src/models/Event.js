const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La description est requise'],
    },
    date: {
      type: Date,
      required: [true, 'La date est requise'],
    },
    location: {
      type: String,
      required: [true, 'Le lieu est requis'],
      trim: true,
    },
    maxParticipants: {
      type: Number,
      required: [true, 'Le nombre de places est requis'],
      min: 1,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Virtuel : places restantes
eventSchema.virtual('availableSpots').get(function () {
  return this.maxParticipants - this.participants.length;
});

// Inclure les virtuels dans le JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
