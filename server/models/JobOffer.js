const mongoose = require('mongoose');

const jobOfferSchema = new mongoose.Schema(
  {
    offerId: {
      type: String,
      required: [true, 'Offer ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employer ID is required'],
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    candidateEmail: {
      type: String,
      required: [true, 'Candidate email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    candidateName: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    salary: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'USD', trim: true },
      period: { type: String, default: 'annual', trim: true },
    },
    offerDate: {
      type: Date,
      required: [true, 'Offer date is required'],
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship'],
      default: 'full-time',
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'accepted', 'rejected', 'revoked'],
      default: 'draft',
      index: true,
    },
    documentHash: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    documentPath: {
      type: String,
      default: null,
    },
    documentOriginalName: {
      type: String,
      default: null,
    },
    blockchainTxHash: {
      type: String,
      trim: true,
      default: null,
    },
    blockNumber: {
      type: Number,
      default: null,
    },
    contractAddress: {
      type: String,
      trim: true,
      default: null,
    },
    onChain: {
      type: Boolean,
      default: false,
      index: true,
    },
    qrCodeData: {
      type: String,
      default: null,
    },
    qrCodePath: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

jobOfferSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('JobOffer', jobOfferSchema);
