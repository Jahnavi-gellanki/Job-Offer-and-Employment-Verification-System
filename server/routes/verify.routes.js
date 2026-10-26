const express = require('express');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const JobOffer = require('../models/JobOffer');
const VerificationLog = require('../models/VerificationLog');
const { protect } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');
const blockchainService = require('../services/blockchain.service');
const hashService = require('../services/hash.service');

const router = express.Router();

// Helper to sanitize offer details for public responses
const sanitizeOfferForPublic = (offer) => {
  return {
    offerId: offer.offerId,
    candidateName: offer.candidateName,
    jobTitle: offer.jobTitle,
    department: offer.department,
    company: offer.companyId
      ? {
          name: offer.companyId.name,
          industry: offer.companyId.industry,
          website: offer.companyId.website,
          verificationStatus: offer.companyId.verificationStatus,
        }
      : null,
    employmentType: offer.employmentType,
    offerDate: offer.offerDate,
    expiryDate: offer.expiryDate,
    status: offer.status,
    onChain: offer.onChain,
    documentHash: offer.documentHash,
    blockchainTxHash: offer.blockchainTxHash,
    blockNumber: offer.blockNumber,
    contractAddress: offer.contractAddress,
    qrCodeData: offer.qrCodeData,
    qrCodePath: offer.qrCodePath,
    createdAt: offer.createdAt,
  };
};

// @route   GET /api/verify/offer/:offerId
// @desc    Verify offer by offer UUID (Public)
// @access  Public
router.get('/offer/:offerId', async (req, res) => {
  const { offerId } = req.params;

  const offer = await JobOffer.findOne({ offerId }).populate('companyId');

  if (!offer) {
    await VerificationLog.create({
      offerId,
      verifiedBy: 'anonymous',
      verificationType: 'id',
      result: 'not_found',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      details: { reason: 'Offer ID not found in database' },
    });

    return res.status(404).json({
      success: false,
      result: 'not_found',
      message: `No job offer found with ID: ${offerId}`,
    });
  }

  let onChainData = null;
  let result = 'valid';

  if (offer.status === 'revoked') {
    result = 'revoked';
  }

  if (offer.onChain) {
    try {
      onChainData = await blockchainService.getOfferOnChain(offer.offerId);
      if (onChainData.isRevoked) {
        result = 'revoked';
      }
    } catch (err) {
      console.warn('Blockchain read failed during public verification:', err.message);
    }
  }

  await VerificationLog.create({
    offerId: offer.offerId,
    verifiedBy: req.user ? req.user.email : 'anonymous',
    verificationType: 'id',
    result,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    details: { onChain: offer.onChain, status: offer.status },
  });

  res.status(200).json({
    success: true,
    result,
    isValid: result === 'valid',
    isRevoked: result === 'revoked',
    offer: sanitizeOfferForPublic(offer),
    onChainData,
  });
});

// @route   POST /api/verify/hash
// @desc    Verify offer by offerId and document hash (Public)
// @access  Public
router.post(
  '/hash',
  [
    body('offerId').trim().notEmpty().withMessage('Offer ID is required'),
    body('documentHash').trim().notEmpty().withMessage('Document hash is required'),
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

    const { offerId, documentHash } = req.body;
    const cleanHash = documentHash.replace(/^0x/i, '').toLowerCase();

    const offer = await JobOffer.findOne({ offerId }).populate('companyId');
    if (!offer) {
      await VerificationLog.create({
        offerId,
        verifiedBy: 'anonymous',
        verificationType: 'hash',
        result: 'not_found',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        details: { documentHash: cleanHash },
      });

      return res.status(404).json({
        success: false,
        result: 'not_found',
        message: `No job offer found with ID: ${offerId}`,
      });
    }

    let onChainResult = null;
    let result = 'invalid';

    if (offer.onChain) {
      try {
        onChainResult = await blockchainService.verifyOffer(offerId, cleanHash);
        if (onChainResult.isRevoked) {
          result = 'revoked';
        } else if (onChainResult.isValid) {
          result = 'valid';
        } else {
          result = 'invalid';
        }
      } catch (err) {
        console.warn('Smart contract verification call failed, falling back to database:', err.message);
        const storedHash = (offer.documentHash || '').replace(/^0x/i, '').toLowerCase();
        if (offer.status === 'revoked') {
          result = 'revoked';
        } else if (storedHash === cleanHash) {
          result = 'valid';
        } else {
          result = 'invalid';
        }
      }
    } else {
      const storedHash = (offer.documentHash || '').replace(/^0x/i, '').toLowerCase();
      if (offer.status === 'revoked') {
        result = 'revoked';
      } else if (storedHash === cleanHash) {
        result = 'valid';
      } else {
        result = 'invalid';
      }
    }

    await VerificationLog.create({
      offerId: offer.offerId,
      verifiedBy: req.user ? req.user.email : 'anonymous',
      verificationType: 'hash',
      result,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      details: { documentHash: cleanHash, onChainResult },
    });

    res.status(200).json({
      success: true,
      result,
      isValid: result === 'valid',
      isRevoked: result === 'revoked',
      offerId,
      documentHash: cleanHash,
      offer: sanitizeOfferForPublic(offer),
      onChainResult,
    });
  }
);

// @route   POST /api/verify/upload-and-verify
// @desc    Upload document, calculate SHA-256, verify against blockchain and delete file
// @access  Public
router.post('/upload-and-verify', uploadSingle, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a PDF or image document to verify',
    });
  }

  const uploadedPath = req.file.path;
  let calculatedHash = '';

  try {
    calculatedHash = hashService.hashFile(uploadedPath);
  } finally {
    // Verifier's upload is ephemeral: clean up immediately to protect privacy
    try {
      if (fs.existsSync(uploadedPath)) {
        fs.unlinkSync(uploadedPath);
      }
    } catch (cleanupErr) {
      console.warn('Failed to delete temporary uploaded file:', cleanupErr.message);
    }
  }

  const offerId = req.body.offerId ? req.body.offerId.trim() : null;

  let offer = null;
  if (offerId) {
    offer = await JobOffer.findOne({ offerId }).populate('companyId');
  } else {
    // If no offerId supplied, search for an offer matching this document hash
    offer = await JobOffer.findOne({
      documentHash: { $regex: new RegExp(`^0x?${calculatedHash}$`, 'i') },
    }).populate('companyId');
  }

  if (!offer) {
    await VerificationLog.create({
      offerId: offerId || 'UNKNOWN',
      verifiedBy: 'anonymous',
      verificationType: 'upload',
      result: 'not_found',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      details: { calculatedHash },
    });

    return res.status(404).json({
      success: false,
      result: 'not_found',
      calculatedHash,
      message: 'No registered job offer matches this document hash',
    });
  }

  let onChainResult = null;
  let result = 'invalid';

  if (offer.onChain) {
    try {
      onChainResult = await blockchainService.verifyOffer(offer.offerId, calculatedHash);
      if (onChainResult.isRevoked) {
        result = 'revoked';
      } else if (onChainResult.isValid) {
        result = 'valid';
      } else {
        result = 'invalid';
      }
    } catch (err) {
      console.warn('Blockchain verification failed in upload-and-verify:', err.message);
      const storedHash = (offer.documentHash || '').replace(/^0x/i, '').toLowerCase();
      if (offer.status === 'revoked') {
        result = 'revoked';
      } else if (storedHash === calculatedHash) {
        result = 'valid';
      } else {
        result = 'invalid';
      }
    }
  } else {
    const storedHash = (offer.documentHash || '').replace(/^0x/i, '').toLowerCase();
    if (offer.status === 'revoked') {
      result = 'revoked';
    } else if (storedHash === calculatedHash) {
      result = 'valid';
    } else {
      result = 'invalid';
    }
  }

  await VerificationLog.create({
    offerId: offer.offerId,
    verifiedBy: req.user ? req.user.email : 'anonymous',
    verificationType: 'upload',
    result,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    details: { calculatedHash, onChainResult },
  });

  res.status(200).json({
    success: true,
    result,
    isValid: result === 'valid',
    isRevoked: result === 'revoked',
    calculatedHash,
    offer: sanitizeOfferForPublic(offer),
    onChainResult,
  });
});

// @route   POST /api/verify/employment/:offerId
// @desc    Request & record employment verification on blockchain
// @access  Public
router.post(
  '/employment/:offerId',
  [
    body('verifierName').optional().trim(),
    body('verifierOrganization').optional().trim(),
    body('purpose').optional().trim(),
    body('notes').optional().trim(),
  ],
  async (req, res) => {
    const { offerId } = req.params;
    const { verifierName, verifierOrganization, purpose, notes } = req.body;

    const offer = await JobOffer.findOne({ offerId });
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found',
      });
    }

    if (!offer.onChain) {
      return res.status(400).json({
        success: false,
        message: 'This offer is not registered on the blockchain yet',
      });
    }

    if (offer.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record employment verification for a revoked offer',
      });
    }

    const recordNotes = `${verifierName || 'Anonymous'} [${verifierOrganization || 'Third Party'}] - ${purpose || 'Verification'}${notes ? ': ' + notes : ''}`;

    try {
      const txResult = await blockchainService.recordEmploymentVerification(
        offerId,
        null,
        recordNotes
      );

      await VerificationLog.create({
        offerId,
        verifiedBy: verifierName || 'anonymous',
        verificationType: 'id',
        result: 'valid',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        details: { action: 'employment_verification_recorded', notes: recordNotes },
      });

      res.status(200).json({
        success: true,
        message: 'Employment verification successfully recorded on the blockchain',
        txHash: txResult.txHash,
        blockNumber: txResult.blockNumber,
      });
    } catch (err) {
      console.error('Error recording employment verification:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to record employment verification on blockchain: ' + err.message,
      });
    }
  }
);

// @route   GET /api/verify/history
// @desc    Get verification logs for offers belonging to current user
// @access  Private
router.get('/history', protect, async (req, res) => {
  let offerIds = [];

  if (req.user.role === 'admin') {
    const logs = await VerificationLog.find().sort({ timestamp: -1 }).limit(100);
    return res.status(200).json({ success: true, count: logs.length, logs });
  }

  if (req.user.role === 'employer') {
    const offers = await JobOffer.find({ employerId: req.user._id }).select('offerId');
    offerIds = offers.map((o) => o.offerId);
  } else if (req.user.role === 'candidate') {
    const offers = await JobOffer.find({
      $or: [{ candidateEmail: req.user.email }, { candidateId: req.user._id }],
    }).select('offerId');
    offerIds = offers.map((o) => o.offerId);
  }

  const logs = await VerificationLog.find({ offerId: { $in: offerIds } })
    .sort({ timestamp: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    count: logs.length,
    logs,
  });
});

module.exports = router;
