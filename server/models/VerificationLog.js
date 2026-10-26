const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema({
  offerId: {
    type: String,
    required: [true, 'Offer ID is required'],
    index: true,
  },
  verifiedBy: {
    type: String,
    default: 'anonymous',
  },
  verificationType: {
    type: String,
    enum: ['id', 'hash', 'qr', 'upload'],
    required: [true, 'Verification type is required'],
  },
  result: {
    type: String,
    enum: ['valid', 'invalid', 'revoked', 'not_found'],
    required: [true, 'Verification result is required'],
  },
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({}),
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

verificationLogSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('VerificationLog', verificationLogSchema);
