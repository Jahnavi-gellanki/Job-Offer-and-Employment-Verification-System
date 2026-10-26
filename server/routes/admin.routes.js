const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const JobOffer = require('../models/JobOffer');
const AuditLog = require('../models/AuditLog');
const VerificationLog = require('../models/VerificationLog');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { createAuditLog } = require('../middleware/audit.middleware');
const blockchainService = require('../services/blockchain.service');

const router = express.Router();

// Apply auth and admin role check to all admin routes
router.use(protect, authorize('admin'));

// @route   GET /api/admin/users
// @desc    List all users with pagination, role filtering, and search
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.role) {
    query.role = req.query.role;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [{ name: searchRegex }, { email: searchRegex }, { walletAddress: searchRegex }];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .populate('companyId', 'name registrationNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    users,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

// @route   PUT /api/admin/users/:id
// @desc    Update user details (role, isVerified, isActive, walletAddress)
// @access  Private (Admin)
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role, isVerified, isActive, walletAddress } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (role) user.role = role;
  if (isVerified !== undefined) user.isVerified = isVerified;
  if (isActive !== undefined) user.isActive = isActive;
  if (walletAddress !== undefined) user.walletAddress = walletAddress;

  await user.save();

  await createAuditLog(
    req.user._id,
    req.user.email,
    'ADMIN_USER_UPDATED',
    'User',
    user._id,
    { updatedFields: req.body },
    req.ip
  );

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user,
  });
});

// @route   DELETE /api/admin/users/:id
// @desc    Soft-deactivate a user
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  if (req.user._id.toString() === id) {
    return res.status(400).json({
      success: false,
      message: 'Admin cannot deactivate their own account',
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  user.isActive = false;
  await user.save();

  await createAuditLog(
    req.user._id,
    req.user.email,
    'ADMIN_USER_DEACTIVATED',
    'User',
    user._id,
    { targetEmail: user.email },
    req.ip
  );

  res.status(200).json({
    success: true,
    message: 'User account has been deactivated',
  });
});

// @route   GET /api/admin/companies
// @desc    List all registered companies
// @access  Private (Admin)
router.get('/companies', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.verificationStatus) {
    query.verificationStatus = req.query.verificationStatus;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { name: searchRegex },
      { registrationNumber: searchRegex },
      { industry: searchRegex },
      { walletAddress: searchRegex },
    ];
  }

  const [companies, total] = await Promise.all([
    Company.find(query)
      .populate('adminUserId', 'name email walletAddress isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Company.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    companies,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

// @route   PUT /api/admin/companies/:id/verify
// @desc    Approve or reject company registration & register wallet on blockchain if approved
// @access  Private (Admin)
router.put(
  '/companies/:id/verify',
  [
    body('status')
      .isIn(['approved', 'rejected'])
      .withMessage("Status must be either 'approved' or 'rejected'"),
    body('walletAddress').optional().trim(),
    body('reason').optional().trim(),
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
    const { status, reason, walletAddress } = req.body;

    const company = await Company.findById(id).populate('adminUserId');
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    company.verificationStatus = status;

    // Save wallet address if provided during approval
    if (status === 'approved' && walletAddress) {
      company.walletAddress = walletAddress;
    }

    await company.save();

    let blockchainTx = null;

    if (status === 'approved') {
      // Mark employer user as verified
      if (company.adminUserId) {
        const updatePayload = { isVerified: true };
        // Also save wallet to user record if provided
        if (walletAddress) {
          updatePayload.walletAddress = walletAddress;
        }
        await User.findByIdAndUpdate(company.adminUserId._id, updatePayload);
      }

      // Register wallet on blockchain if address is available
      const targetWallet =
        walletAddress ||
        company.walletAddress ||
        (company.adminUserId && company.adminUserId.walletAddress);

      if (targetWallet) {
        try {
          blockchainTx = await blockchainService.registerEmployer(targetWallet);
        } catch (chainErr) {
          console.error('Failed to register employer wallet on blockchain:', chainErr.message);
          // Don't fail the approval — blockchain registration can be retried separately
        }
      }
    }

    await createAuditLog(
      req.user._id,
      req.user.email,
      'ADMIN_COMPANY_VERIFIED',
      'Company',
      company._id,
      {
        companyName: company.name,
        verificationStatus: status,
        walletAddress: walletAddress || null,
        reason,
        blockchainTx,
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: `Company has been ${status}`,
      company,
      blockchainTx,
    });
  }
);

// @route   POST /api/admin/blockchain/register-employer
// @desc    Directly register an employer wallet on blockchain
// @access  Private (Admin)
router.post(
  '/blockchain/register-employer',
  [
    body('walletAddress')
      .trim()
      .notEmpty()
      .withMessage('Employer wallet address is required'),
    body('userId').optional().trim(),
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

    const { walletAddress, userId } = req.body;

    try {
      const txResult = await blockchainService.registerEmployer(walletAddress);

      if (userId) {
        await User.findByIdAndUpdate(userId, {
          walletAddress,
          isVerified: true,
        });
      }

      await createAuditLog(
        req.user._id,
        req.user.email,
        'ADMIN_REGISTER_EMPLOYER_ON_CHAIN',
        'Blockchain',
        walletAddress,
        { txResult, userId },
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Employer wallet successfully registered on blockchain',
        receipt: txResult,
      });
    } catch (err) {
      console.error('Error registering employer on blockchain:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to register employer on blockchain: ' + err.message,
      });
    }
  }
);

// @route   GET /api/admin/audit-logs
// @desc    Retrieve system audit logs with pagination and filters
// @access  Private (Admin)
router.get('/audit-logs', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.action) {
    query.action = req.query.action;
  }
  if (req.query.actorId) {
    query.actorId = req.query.actorId;
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    logs,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

// @route   GET /api/admin/verification-logs
// @desc    Retrieve all public verification logs with pagination
// @access  Private (Admin)
router.get('/verification-logs', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.result) {
    query.result = req.query.result;
  }
  if (req.query.verificationType) {
    query.verificationType = req.query.verificationType;
  }
  if (req.query.offerId) {
    query.offerId = req.query.offerId;
  }

  const [logs, total] = await Promise.all([
    VerificationLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
    VerificationLog.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    logs,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

// @route   GET /api/admin/stats
// @desc    Get complete administrative dashboard statistics
// @access  Private (Admin)
router.get('/stats', async (req, res) => {
  const [
    totalUsers,
    adminUsers,
    employerUsers,
    candidateUsers,
    recruiterUsers,
    totalCompanies,
    pendingCompanies,
    approvedCompanies,
    rejectedCompanies,
    totalOffers,
    draftOffers,
    issuedOffers,
    acceptedOffers,
    rejectedOffers,
    revokedOffers,
    onChainOffers,
    totalVerificationsLogged,
    contractStats,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'employer' }),
    User.countDocuments({ role: 'candidate' }),
    User.countDocuments({ role: 'recruiter' }),
    Company.countDocuments(),
    Company.countDocuments({ verificationStatus: 'pending' }),
    Company.countDocuments({ verificationStatus: 'approved' }),
    Company.countDocuments({ verificationStatus: 'rejected' }),
    JobOffer.countDocuments(),
    JobOffer.countDocuments({ status: 'draft' }),
    JobOffer.countDocuments({ status: 'issued' }),
    JobOffer.countDocuments({ status: 'accepted' }),
    JobOffer.countDocuments({ status: 'rejected' }),
    JobOffer.countDocuments({ status: 'revoked' }),
    JobOffer.countDocuments({ onChain: true }),
    VerificationLog.countDocuments(),
    blockchainService.getContractStats(),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
        admin: adminUsers,
        employer: employerUsers,
        candidate: candidateUsers,
        recruiter: recruiterUsers,
      },
      companies: {
        total: totalCompanies,
        pending: pendingCompanies,
        approved: approvedCompanies,
        rejected: rejectedCompanies,
      },
      offers: {
        total: totalOffers,
        draft: draftOffers,
        issued: issuedOffers,
        accepted: acceptedOffers,
        rejected: rejectedOffers,
        revoked: revokedOffers,
        onChain: onChainOffers,
      },
      verifications: {
        totalLogged: totalVerificationsLogged,
      },
      blockchain: contractStats,
    },
  });
});

module.exports = router;
