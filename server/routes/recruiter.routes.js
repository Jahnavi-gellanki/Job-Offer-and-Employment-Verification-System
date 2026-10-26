const express = require('express');
const { body, validationResult } = require('express-validator');
const JobOffer = require('../models/JobOffer');
const VerificationLog = require('../models/VerificationLog');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { createAuditLog } = require('../middleware/audit.middleware');
const blockchainService = require('../services/blockchain.service');

const router = express.Router();

// Recruiters and admins can access all recruiter routes
router.use(protect, authorize('recruiter', 'admin'));

// @route   GET /api/recruiter/verify/:offerId
// @desc    Recruiter verifies an offer — checks DB + blockchain, logs the check
// @access  Private (Recruiter, Admin)
router.get('/verify/:offerId', async (req, res) => {
  const { offerId } = req.params;

  const offer = await JobOffer.findOne({ offerId })
    .populate('companyId', 'name industry website verificationStatus')
    .populate('employerId', 'name email');

  if (!offer) {
    await VerificationLog.create({
      offerId,
      verifiedBy: req.user.email,
      verificationType: 'id',
      result: 'not_found',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      details: { recruiterCheck: true, reason: 'Offer ID not found' },
    });
    return res.status(404).json({
      success: false,
      result: 'not_found',
      message: `No offer found with ID: ${offerId}`,
    });
  }

  let onChainData = null;
  let result = offer.status === 'revoked' ? 'revoked' : 'valid';

  if (offer.onChain) {
    try {
      onChainData = await blockchainService.getOfferOnChain(offer.offerId);
      if (onChainData.isRevoked) result = 'revoked';
    } catch (err) {
      console.warn('Blockchain read failed in recruiter verify:', err.message);
    }
  }

  await VerificationLog.create({
    offerId: offer.offerId,
    verifiedBy: req.user.email,
    verificationType: 'id',
    result,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    details: { recruiterCheck: true, onChain: offer.onChain, status: offer.status },
  });

  await createAuditLog(
    req.user._id,
    req.user.email,
    'RECRUITER_OFFER_VERIFIED',
    'JobOffer',
    offer._id,
    { offerId, result },
    req.ip
  );

  res.status(200).json({
    success: true,
    result,
    isValid: result === 'valid',
    isRevoked: result === 'revoked',
    offer: {
      offerId: offer.offerId,
      jobTitle: offer.jobTitle,
      department: offer.department,
      candidateName: offer.candidateName,
      candidateEmail: offer.candidateEmail,
      employmentType: offer.employmentType,
      offerDate: offer.offerDate,
      expiryDate: offer.expiryDate,
      status: offer.status,
      onChain: offer.onChain,
      documentHash: offer.documentHash,
      blockchainTxHash: offer.blockchainTxHash,
      blockNumber: offer.blockNumber,
      contractAddress: offer.contractAddress,
      company: offer.companyId,
      employer: offer.employerId,
    },
    onChainData,
  });
});

// @route   POST /api/recruiter/verify-hash
// @desc    Recruiter verifies offer by offerId + document hash
// @access  Private (Recruiter, Admin)
router.post(
  '/verify-hash',
  [
    body('offerId').trim().notEmpty().withMessage('Offer ID is required'),
    body('documentHash').trim().notEmpty().withMessage('Document hash is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { offerId, documentHash } = req.body;
    const cleanHash = documentHash.replace(/^0x/i, '').toLowerCase();

    const offer = await JobOffer.findOne({ offerId }).populate('companyId', 'name industry');
    if (!offer) {
      await VerificationLog.create({
        offerId,
        verifiedBy: req.user.email,
        verificationType: 'hash',
        result: 'not_found',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        details: { recruiterCheck: true, documentHash: cleanHash },
      });
      return res.status(404).json({ success: false, result: 'not_found', message: `No offer found with ID: ${offerId}` });
    }

    let result = 'invalid';
    let onChainResult = null;

    if (offer.onChain) {
      try {
        onChainResult = await blockchainService.verifyOffer(offerId, cleanHash);
        if (onChainResult.isRevoked) result = 'revoked';
        else if (onChainResult.isValid) result = 'valid';
      } catch (err) {
        console.warn('Blockchain hash verify failed, falling back to DB:', err.message);
        const storedHash = (offer.documentHash || '').replace(/^0x/i, '').toLowerCase();
        result = offer.status === 'revoked' ? 'revoked' : storedHash === cleanHash ? 'valid' : 'invalid';
      }
    } else {
      const storedHash = (offer.documentHash || '').replace(/^0x/i, '').toLowerCase();
      result = offer.status === 'revoked' ? 'revoked' : storedHash === cleanHash ? 'valid' : 'invalid';
    }

    await VerificationLog.create({
      offerId: offer.offerId,
      verifiedBy: req.user.email,
      verificationType: 'hash',
      result,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      details: { recruiterCheck: true, documentHash: cleanHash, onChainResult },
    });

    await createAuditLog(
      req.user._id,
      req.user.email,
      'RECRUITER_HASH_VERIFIED',
      'JobOffer',
      offer._id,
      { offerId, result, documentHash: cleanHash },
      req.ip
    );

    res.status(200).json({
      success: true,
      result,
      isValid: result === 'valid',
      isRevoked: result === 'revoked',
      offerId,
      documentHash: cleanHash,
      onChainResult,
      offer: {
        offerId: offer.offerId,
        jobTitle: offer.jobTitle,
        candidateName: offer.candidateName,
        status: offer.status,
        onChain: offer.onChain,
        company: offer.companyId,
      },
    });
  }
);

// @route   POST /api/recruiter/employment-confirm/:offerId
// @desc    Recruiter records formal employment confirmation on blockchain
// @access  Private (Recruiter, Admin)
router.post(
  '/employment-confirm/:offerId',
  [
    body('organization').trim().notEmpty().withMessage('Organization name is required'),
    body('purpose').optional().trim(),
    body('notes').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { offerId } = req.params;
    const { organization, purpose, notes } = req.body;

    const offer = await JobOffer.findOne({ offerId });
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (!offer.onChain) {
      return res.status(400).json({
        success: false,
        message: 'This offer is not registered on the blockchain. Cannot record employment confirmation.',
      });
    }

    if (offer.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'Cannot confirm employment for a revoked offer',
      });
    }

    const recordNotes = `${req.user.name || req.user.email} [${organization}] - ${purpose || 'Employment Confirmation'}${notes ? ': ' + notes : ''}`;

    try {
      const txResult = await blockchainService.recordEmploymentVerification(offerId, null, recordNotes);

      await VerificationLog.create({
        offerId,
        verifiedBy: req.user.email,
        verificationType: 'id',
        result: 'valid',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        details: {
          action: 'employment_confirmation',
          organization,
          purpose,
          txHash: txResult.txHash,
        },
      });

      await createAuditLog(
        req.user._id,
        req.user.email,
        'RECRUITER_EMPLOYMENT_CONFIRMED',
        'JobOffer',
        offer._id,
        { offerId, organization, txHash: txResult.txHash },
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Employment confirmation recorded on blockchain',
        txHash: txResult.txHash,
        blockNumber: txResult.blockNumber,
      });
    } catch (err) {
      console.error('Employment confirmation blockchain error:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to record employment confirmation: ' + err.message,
      });
    }
  }
);

// @route   GET /api/recruiter/history
// @desc    Get recruiter's own verification history
// @access  Private (Recruiter, Admin)
router.get('/history', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const query = { verifiedBy: req.user.email };
  if (req.query.result) query.result = req.query.result;

  const [logs, total] = await Promise.all([
    VerificationLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
    VerificationLog.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    logs,
    pagination: { total, page, pages: Math.ceil(total / limit) || 1, limit },
  });
});

// @route   GET /api/recruiter/stats
// @desc    Recruiter dashboard stats
// @access  Private (Recruiter, Admin)
router.get('/stats', async (req, res) => {
  const email = req.user.email;
  const [total, valid, invalid, revoked, notFound] = await Promise.all([
    VerificationLog.countDocuments({ verifiedBy: email }),
    VerificationLog.countDocuments({ verifiedBy: email, result: 'valid' }),
    VerificationLog.countDocuments({ verifiedBy: email, result: 'invalid' }),
    VerificationLog.countDocuments({ verifiedBy: email, result: 'revoked' }),
    VerificationLog.countDocuments({ verifiedBy: email, result: 'not_found' }),
  ]);

  res.status(200).json({
    success: true,
    stats: { total, valid, invalid, revoked, notFound },
  });
});

module.exports = router;
