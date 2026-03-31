const mongoose = require('mongoose');
const crypto = require('crypto');

const consentLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: ['consent_given', 'consent_withdrawn', 'data_accessed', 'data_deleted', 'data_modified'],
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Hash de l'IP avant sauvegarde (RGPD : ne pas stocker l'IP en clair)
consentLogSchema.pre('save', function (next) {
  if (this.isModified('ipAddress') && this.ipAddress) {
    this.ipAddress = crypto
      .createHash('sha256')
      .update(this.ipAddress)
      .digest('hex');
  }
  next();
});

module.exports = mongoose.model('ConsentLog', consentLogSchema);
