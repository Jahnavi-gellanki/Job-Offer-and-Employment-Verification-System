const express = require('express');
const { body, validationResult } = require('express-validator');
const JobOffer = require('../models/JobOffer');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { createAuditLog } = require('../middleware/audit.middleware');
const blockchainService = require('../services/blockchain.service');

const router = express.Router();

// Apply auth and candidate role check to all candidate routes
router.use(protect, authorize('candidate'));

// @route   GET /api/candidate/offers
// @desc    Get all job offers sent to this candidate
// @access  Private (Candidate)
router.get('/offers', async (req, res) => {
  const userEmail = req.user.email.toLowerCase().trim();
  const userId = req.user._id;

  // Candidate sees offers addressed to their email (case-insensitive) or user ID.
  // Exclude draft offers — candidates only see issued/accepted/rejected/revoked.
  const offers = await JobOffer.find({
    $and: [
      {
        $or: [
          { candidateEmail: { $regex: new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { candidateId: userId },
        ],
      },
      { status: { $ne: 'draft' } },
    ],
  })
    .populate('companyId', 'name industry website verificationStatus')
    .populate('employerId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: offers.length,
    offers,
  });
});

// @route   GET /api/candidate/offers/:id
// @desc    Get specific offer detail for candidate
// @access  Private (Candidate)
router.get('/offers/:id', async (req, res) => {
  const { id } = req.params;
  const userEmail = req.user.email.toLowerCase().trim();
  const userId = req.user._id;

  const isUUID = id.includes('-');
  const query = isUUID ? { offerId: id } : { _id: id };

  const offer = await JobOffer.findOne(query)
    .populate('companyId')
    .populate('employerId', 'name email');

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found',
    });
  }

  const isCandidateMatch =
    offer.candidateEmail.toLowerCase().trim() === userEmail ||
    (offer.candidateId && offer.candidateId.toString() === userId.toString());

  if (!isCandidateMatch) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to view this offer',
    });
  }

  // Ensure candidateId is linked if not already
  if (!offer.candidateId) {
    offer.candidateId = userId;
    await offer.save();
  }

  let onChainData = null;
  if (offer.onChain) {
    try {
      onChainData = await blockchainService.getOfferOnChain(offer.offerId);
    } catch (err) {
      console.warn('Could not fetch candidate on-chain offer details:', err.message);
    }
  }

  res.status(200).json({
    success: true,
    offer,
    onChainData,
  });
});

// @route   PUT /api/candidate/offers/:id/respond
// @desc    Accept or reject a received job offer
// @access  Private (Candidate)
router.put(
  '/offers/:id/respond',
  [
    body('response')
      .isIn(['accepted', 'rejected'])
      .withMessage("Response must be either 'accepted' or 'rejected'"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { response } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();
    const userId = req.user._id;

    const query = id.includes('-') ? { offerId: id } : { _id: id };
    const offer = await JobOffer.findOne(query);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    const isCandidateMatch =
      offer.candidateEmail.toLowerCase().trim() === userEmail ||
      (offer.candidateId && offer.candidateId.toString() === userId.toString());

    if (!isCandidateMatch) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to respond to this offer',
      });
    }

    if (offer.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'This offer has been revoked by the employer and cannot be responded to',
      });
    }

    if (offer.status !== 'issued') {
      return res.status(400).json({
        success: false,
        message: `This offer is currently '${offer.status}' and cannot be responded to`,
      });
    }

    offer.status = response;
    offer.candidateId = userId;
    await offer.save();

    await createAuditLog(
      userId,
      userEmail,
      `OFFER_${response.toUpperCase()}`,
      'JobOffer',
      offer._id,
      { offerId: offer.offerId, response },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: `You have successfully ${response} the job offer`,
      offer,
    });
  }
);

// @route   GET /api/candidate/stats
// @desc    Get candidate's job offers stats
// @access  Private (Candidate)
router.get('/stats', async (req, res) => {
  const userEmail = req.user.email.toLowerCase().trim();
  const userId = req.user._id;
  const emailRegex = new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

  const baseFilter = {
    $or: [
      { candidateEmail: { $regex: emailRegex } },
      { candidateId: userId },
    ],
    status: { $ne: 'draft' },
  };

  const [total, pending, accepted, rejected, revoked] = await Promise.all([
    JobOffer.countDocuments(baseFilter),
    JobOffer.countDocuments({ ...baseFilter, status: 'issued' }),
    JobOffer.countDocuments({ ...baseFilter, status: 'accepted' }),
    JobOffer.countDocuments({ ...baseFilter, status: 'rejected' }),
    JobOffer.countDocuments({ ...baseFilter, status: 'revoked' }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      total,
      pending,
      accepted,
      rejected,
      revoked,
    },
  });
});

module.exports = router;
