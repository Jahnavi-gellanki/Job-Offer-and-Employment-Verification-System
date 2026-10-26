const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const PDFDocument = require('pdfkit');
const { body, validationResult } = require('express-validator');
const JobOffer = require('../models/JobOffer');
const Company = require('../models/Company');
const User = require('../models/User');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { createAuditLog } = require('../middleware/audit.middleware');
const blockchainService = require('../services/blockchain.service');
const qrService = require('../services/qr.service');

const router = express.Router();

// Apply auth and employer role checks to all employer routes
router.use(protect, authorize('employer'));

// @route   POST /api/employer/company
// @desc    Create company profile for employer
// @access  Private (Employer)
router.post(
  '/company',
  [
    body('name').trim().notEmpty().withMessage('Company name is required'),
    body('registrationNumber')
      .trim()
      .notEmpty()
      .withMessage('Registration number is required'),
    body('industry').trim().notEmpty().withMessage('Industry is required'),
    body('website').optional().trim(),
    body('walletAddress').optional().trim(),
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

    const existingCompanyForUser = await Company.findOne({ adminUserId: req.user._id });
    if (existingCompanyForUser) {
      return res.status(400).json({
        success: false,
        message: 'You have already created a company profile',
        company: existingCompanyForUser,
      });
    }

    const { name, registrationNumber, industry, website, address, description, walletAddress } =
      req.body;

    const existingReg = await Company.findOne({ registrationNumber });
    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: 'A company with this registration number already exists',
      });
    }

    const company = await Company.create({
      name,
      registrationNumber,
      industry,
      website: website || '',
      address: address || {},
      description: description || '',
      adminUserId: req.user._id,
      walletAddress: walletAddress || req.user.walletAddress || null,
      verificationStatus: 'pending',
    });

    await User.findByIdAndUpdate(req.user._id, {
      companyId: company._id,
      walletAddress: walletAddress || req.user.walletAddress,
    });

    await createAuditLog(
      req.user._id,
      req.user.email,
      'COMPANY_CREATED',
      'Company',
      company._id,
      { name: company.name, registrationNumber: company.registrationNumber },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Company profile created successfully and is pending admin approval',
      company,
    });
  }
);

// @route   GET /api/employer/company
// @desc    Get logged-in employer's company profile
// @access  Private (Employer)
router.get('/company', async (req, res) => {
  let company = null;
  const companyId = req.user.companyId?._id || req.user.companyId;
  if (companyId) {
    company = await Company.findById(companyId).populate(
      'adminUserId',
      'name email walletAddress'
    );
  }
  if (!company) {
    company = await Company.findOne({ adminUserId: req.user._id }).populate(
      'adminUserId',
      'name email walletAddress'
    );
  }

  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'No company profile found for this employer. Please create one.',
    });
  }

  res.status(200).json({
    success: true,
    company,
  });
});

// @route   PUT /api/employer/company
// @desc    Update employer's company profile
// @access  Private (Employer)
router.put('/company', async (req, res) => {
  let company = await Company.findOne({ adminUserId: req.user._id });
  if (!company && req.user.companyId) {
    company = await Company.findById(req.user.companyId);
  }

  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'No company profile found to update',
    });
  }

  const { name, industry, website, address, description, walletAddress } = req.body;

  if (name) company.name = name;
  if (industry) company.industry = industry;
  if (website !== undefined) company.website = website;
  if (address) company.address = { ...company.address, ...address };
  if (description !== undefined) company.description = description;
  if (walletAddress) {
    company.walletAddress = walletAddress;
    await User.findByIdAndUpdate(req.user._id, { walletAddress });
  }

  await company.save();

  await createAuditLog(
    req.user._id,
    req.user.email,
    'COMPANY_UPDATED',
    'Company',
    company._id,
    { updatedFields: Object.keys(req.body) },
    req.ip
  );

  res.status(200).json({
    success: true,
    message: 'Company profile updated successfully',
    company,
  });
});

// @route   POST /api/employer/offers
// @desc    Create a job offer in draft status
// @access  Private (Employer)
router.post(
  '/offers',
  [
    body('candidateEmail').isEmail().withMessage('Valid candidate email is required')
      .customSanitizer(v => v.toLowerCase().trim()),
    body('candidateName').trim().notEmpty().withMessage('Candidate name is required'),
    body('jobTitle').trim().notEmpty().withMessage('Job title is required'),
    body('offerDate').notEmpty().withMessage('Offer date is required'),
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

    // companyId may be a populated object (from auth middleware) or a raw ObjectId
    let companyId = req.user.companyId?._id || req.user.companyId;
    if (!companyId) {
      const company = await Company.findOne({ adminUserId: req.user._id });
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'You must set up a company profile before creating job offers.',
        });
      }
      // Sync the missing companyId back onto the user record
      await User.findByIdAndUpdate(req.user._id, { companyId: company._id });
      companyId = company._id;
    }

    const {
      candidateEmail,
      candidateName,
      jobTitle,
      department,
      salary,
      offerDate,
      expiryDate,
      employmentType,
      notes,
      documentHash,
      documentPath,
      documentOriginalName,
    } = req.body;

    // Normalize email to lowercase for consistent matching
    const normalizedCandidateEmail = candidateEmail.toLowerCase().trim();

    // Check if candidate user already exists in platform
    const candidateUser = await User.findOne({ email: normalizedCandidateEmail });

    const offerId = uuidv4();

    const offer = await JobOffer.create({
      offerId,
      employerId: req.user._id,
      companyId,
      candidateId: candidateUser ? candidateUser._id : null,
      candidateEmail: normalizedCandidateEmail,
      candidateName,
      jobTitle,
      department: department || '',
      salary: salary || { amount: 0, currency: 'USD', period: 'annual' },
      offerDate: new Date(offerDate),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      employmentType: employmentType || 'full-time',
      notes: notes || '',
      documentHash: documentHash || null,
      documentPath: documentPath || null,
      documentOriginalName: documentOriginalName || null,
      status: 'draft',
      onChain: false,
    });

    await createAuditLog(
      req.user._id,
      req.user.email,
      'OFFER_CREATED',
      'JobOffer',
      offer._id,
      { offerId: offer.offerId, candidateEmail, jobTitle },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Job offer draft created successfully',
      offer,
    });
  }
);

// @route   GET /api/employer/offers
// @desc    List offers created by current employer with pagination & search
// @access  Private (Employer)
router.get('/offers', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = { employerId: req.user._id };

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { candidateName: searchRegex },
      { candidateEmail: searchRegex },
      { jobTitle: searchRegex },
      { offerId: searchRegex },
    ];
  }

  const [offers, total] = await Promise.all([
    JobOffer.find(query)
      .populate('companyId', 'name registrationNumber industry')
      .populate('candidateId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    JobOffer.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    offers,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

// @route   GET /api/employer/offers/:id
// @desc    Get detailed single offer by ID or offerId
// @access  Private (Employer)
router.get('/offers/:id', async (req, res) => {
  const { id } = req.params;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const query = isUUID
    ? { offerId: id, employerId: req.user._id }
    : { _id: id, employerId: req.user._id };

  const offer = await JobOffer.findOne(query)
    .populate('companyId')
    .populate('candidateId', 'name email walletAddress isVerified');

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Job offer not found or you do not have permission to access it',
    });
  }

  let onChainData = null;
  if (offer.onChain) {
    try {
      onChainData = await blockchainService.getOfferOnChain(offer.offerId);
    } catch (err) {
      console.warn('Unable to fetch on-chain offer details:', err.message);
    }
  }

  res.status(200).json({
    success: true,
    offer,
    onChainData,
  });
});

// @route   PUT /api/employer/offers/:id/issue
// @desc    Manually issue a draft offer to the candidate (without blockchain)
// @access  Private (Employer)
router.put('/offers/:id/issue', async (req, res) => {
  const { id } = req.params;
  const query = id.includes('-')
    ? { offerId: id, employerId: req.user._id }
    : { _id: id, employerId: req.user._id };

  const offer = await JobOffer.findOne(query);
  if (!offer) {
    return res.status(404).json({ success: false, message: 'Offer not found or unauthorized' });
  }
  if (offer.status !== 'draft') {
    return res.status(400).json({ success: false, message: `Offer is already '${offer.status}', cannot re-issue` });
  }

  // Link candidateId if the candidate has registered
  if (!offer.candidateId) {
    const candidateUser = await User.findOne({ email: offer.candidateEmail });
    if (candidateUser) offer.candidateId = candidateUser._id;
  }

  offer.status = 'issued';
  await offer.save();

  await createAuditLog(
    req.user._id, req.user.email, 'OFFER_ISSUED', 'JobOffer', offer._id,
    { offerId: offer.offerId, candidateEmail: offer.candidateEmail }, req.ip
  );

  res.status(200).json({ success: true, message: 'Offer issued to candidate', offer });
});

// @route   PUT /api/employer/offers/:id/status
// @desc    Update offer status (draft, issued, revoked, etc.)
// @access  Private (Employer)
router.put(
  '/offers/:id/status',
  [
    body('status')
      .isIn(['draft', 'issued', 'accepted', 'rejected', 'revoked'])
      .withMessage('Invalid status value'),
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
    const { status } = req.body;

    const query = id.includes('-')
      ? { offerId: id, employerId: req.user._id }
      : { _id: id, employerId: req.user._id };

    const offer = await JobOffer.findOne(query);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or unauthorized',
      });
    }

    const previousStatus = offer.status;
    offer.status = status;

    // When issuing, always resolve & link the candidateId by email so the
    // candidate dashboard query ($or: [candidateEmail, candidateId]) finds it
    if (status === 'issued' && !offer.candidateId) {
      const candidateUser = await User.findOne({
        email: offer.candidateEmail.toLowerCase().trim(),
      });
      if (candidateUser) offer.candidateId = candidateUser._id;
    }

    await offer.save();

    await createAuditLog(
      req.user._id,
      req.user.email,
      'OFFER_STATUS_UPDATED',
      'JobOffer',
      offer._id,
      { previousStatus, newStatus: status, offerId: offer.offerId },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: `Offer status updated to ${status}`,
      offer,
    });
  }
);

// @route   POST /api/employer/offers/:id/blockchain
// @desc    Register job offer hash on Ethereum smart contract
// @access  Private (Employer)
router.post('/offers/:id/blockchain', async (req, res) => {
  const { id } = req.params;
  const query = id.includes('-')
    ? { offerId: id, employerId: req.user._id }
    : { _id: id, employerId: req.user._id };

  const offer = await JobOffer.findOne(query).populate('candidateId');
  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found or unauthorized',
    });
  }

  if (!offer.documentHash) {
    return res.status(400).json({
      success: false,
      message: 'Offer must have a valid document hash before registering on the blockchain. Please upload the offer document first.',
    });
  }

  // Normalize hash: strip 0x prefix — hexToBytes32 will re-add it
  const normalizedHash = offer.documentHash.startsWith('0x') || offer.documentHash.startsWith('0X')
    ? offer.documentHash.slice(2)
    : offer.documentHash;

  if (normalizedHash.length !== 64) {
    return res.status(400).json({
      success: false,
      message: `Invalid document hash length (${normalizedHash.length} chars). Expected 64-character SHA-256 hex string.`,
    });
  }

  if (offer.onChain) {
    return res.status(400).json({
      success: false,
      message: 'This offer is already registered on the blockchain.',
      txHash: offer.blockchainTxHash,
    });
  }

  const candidateWallet =
    offer.candidateId && offer.candidateId.walletAddress
      ? offer.candidateId.walletAddress
      : null;

  try {
    const txResult = await blockchainService.registerOffer(
      offer.offerId,
      normalizedHash,
      candidateWallet
    );

    // Generate Verification QR Code
    const verificationUrl = qrService.getVerificationUrl(offer.offerId);
    const qrFilename = `qr-${offer.offerId}.png`;
    const qrDiskPath = path.join(__dirname, '../uploads/qrcodes', qrFilename);
    const qrPublicPath = `/uploads/qrcodes/${qrFilename}`;

    await qrService.generateQRCode(verificationUrl, qrDiskPath);

    offer.blockchainTxHash = txResult.txHash;
    offer.blockNumber = txResult.blockNumber;
    offer.contractAddress = txResult.contractAddress;
    offer.onChain = true;
    offer.status = 'issued';
    offer.qrCodeData = verificationUrl;
    offer.qrCodePath = qrPublicPath;

    await offer.save();

    await createAuditLog(
      req.user._id,
      req.user.email,
      'OFFER_BLOCKCHAIN_REGISTERED',
      'JobOffer',
      offer._id,
      {
        offerId: offer.offerId,
        documentHash: offer.documentHash,
        txHash: txResult.txHash,
        blockNumber: txResult.blockNumber,
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Job offer successfully registered on blockchain and issued',
      offer,
      receipt: {
        txHash: txResult.txHash,
        blockNumber: txResult.blockNumber,
        contractAddress: txResult.contractAddress,
      },
    });
  } catch (err) {
    console.error('Blockchain registration failed:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to register offer on blockchain: ' + err.message,
    });
  }
});

// @route   POST /api/employer/offers/:id/revoke
// @desc    Revoke job offer on blockchain & database
// @access  Private (Employer)
router.post('/offers/:id/revoke', async (req, res) => {
  const { id } = req.params;
  const query = id.includes('-')
    ? { offerId: id, employerId: req.user._id }
    : { _id: id, employerId: req.user._id };

  const offer = await JobOffer.findOne(query);
  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found or unauthorized',
    });
  }

  if (offer.status === 'revoked') {
    return res.status(400).json({
      success: false,
      message: 'This offer is already marked as revoked',
    });
  }

  let txResult = null;
  if (offer.onChain) {
    try {
      txResult = await blockchainService.revokeOffer(offer.offerId);
    } catch (err) {
      console.error('Blockchain revocation error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Blockchain revocation failed: ' + err.message,
      });
    }
  }

  offer.status = 'revoked';
  await offer.save();

  await createAuditLog(
    req.user._id,
    req.user.email,
    'OFFER_REVOKED',
    'JobOffer',
    offer._id,
    { offerId: offer.offerId, txHash: txResult ? txResult.txHash : null },
    req.ip
  );

  res.status(200).json({
    success: true,
    message: 'Offer successfully revoked',
    offer,
    txHash: txResult ? txResult.txHash : null,
  });
});

// @route   PUT /api/employer/offers/:id/document
// @desc    Attach document hash and path to an existing offer
// @access  Private (Employer)
router.put('/offers/:id/document', async (req, res) => {
  const { id } = req.params;
  const { documentHash, documentPath, documentOriginalName } = req.body;

  if (!documentHash) {
    return res.status(400).json({
      success: false,
      message: 'documentHash is required',
    });
  }

  // Normalize: strip 0x prefix so DB always stores plain 64-char hex
  const cleanHash = documentHash.startsWith('0x') || documentHash.startsWith('0X')
    ? documentHash.slice(2)
    : documentHash;

  const query = id.includes('-')
    ? { offerId: id, employerId: req.user._id }
    : { _id: id, employerId: req.user._id };

  const offer = await JobOffer.findOne(query);
  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found or unauthorized',
    });
  }

  offer.documentHash = cleanHash;
  if (documentPath) offer.documentPath = documentPath;
  if (documentOriginalName) offer.documentOriginalName = documentOriginalName;
  await offer.save();

  await createAuditLog(
    req.user._id,
    req.user.email,
    'OFFER_DOCUMENT_ATTACHED',
    'JobOffer',
    offer._id,
    { offerId: offer.offerId, documentHash: cleanHash },
    req.ip
  );

  res.status(200).json({
    success: true,
    message: 'Document hash saved to offer',
    offer,
  });
});

// @route   GET /api/employer/offers/:id/pdf
// @desc    Generate and stream a PDF offer letter for the given offer
// @access  Private (Employer)
router.get('/offers/:id/pdf', async (req, res) => {
  const { id } = req.params;
  const query = id.includes('-')
    ? { offerId: id, employerId: req.user._id }
    : { _id: id, employerId: req.user._id };

  const offer = await JobOffer.findOne(query)
    .populate('companyId', 'name industry website address registrationNumber')
    .populate('candidateId', 'name email');

  if (!offer) {
    return res.status(404).json({ success: false, message: 'Offer not found or unauthorized' });
  }

  const company = offer.companyId;
  const verifyUrl = qrService.getVerificationUrl(offer.offerId);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="offer-${offer.offerId}.pdf"`
  );

  const doc = new PDFDocument({ margin: 60, size: 'A4' });
  doc.pipe(res);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text(company?.name || 'Company', { align: 'center' });
  if (company?.industry) {
    doc.fontSize(10).font('Helvetica').fillColor('#555').text(company.industry, { align: 'center' });
  }
  doc.moveDown(0.5);
  doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(1);

  // Title
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#000').text('LETTER OF EMPLOYMENT OFFER', { align: 'center' });
  doc.moveDown(1);

  // Date
  const issueDate = offer.offerDate ? new Date(offer.offerDate).toDateString() : new Date().toDateString();
  doc.fontSize(10).font('Helvetica').text(`Date: ${issueDate}`);
  doc.moveDown(0.5);

  // Candidate address block
  doc.text(`Dear ${offer.candidateName},`);
  doc.moveDown(0.5);
  doc.text(
    `We are pleased to offer you the position of ${offer.jobTitle}${
      offer.department ? ` in the ${offer.department} department` : ''
    } at ${company?.name || 'our company'}.`
  );
  doc.moveDown(1);

  // Terms table
  const terms = [
    ['Position', offer.jobTitle],
    ['Department', offer.department || 'N/A'],
    ['Employment Type', (offer.employmentType || 'full-time').replace('-', ' ')],
    ['Offer Date', issueDate],
    ['Expiry Date', offer.expiryDate ? new Date(offer.expiryDate).toDateString() : 'N/A'],
  ];
  if (offer.salary?.amount) {
    terms.push(['Compensation', `${offer.salary.currency || 'USD'} ${Number(offer.salary.amount).toLocaleString()} / ${offer.salary.period || 'year'}`]);
  }

  doc.fontSize(11).font('Helvetica-Bold').text('Offer Terms:', { underline: true });
  doc.moveDown(0.5);
  terms.forEach(([label, value]) => {
    doc.fontSize(10).font('Helvetica-Bold').text(`${label}: `, { continued: true });
    doc.font('Helvetica').text(value);
  });
  doc.moveDown(1);

  if (offer.notes) {
    doc.fontSize(11).font('Helvetica-Bold').text('Additional Terms:', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').text(offer.notes);
    doc.moveDown(1);
  }

  // Blockchain section
  doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(0.5);
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#333').text('BLOCKCHAIN VERIFICATION');
  doc.fontSize(8).font('Helvetica').fillColor('#555');
  doc.text(`Offer ID: ${offer.offerId}`);
  if (offer.onChain) {
    doc.text(`Transaction Hash: ${offer.blockchainTxHash || 'N/A'}`);
    doc.text(`Block Number: ${offer.blockNumber || 'N/A'}`);
    doc.text(`Contract: ${offer.contractAddress || 'N/A'}`);
  } else {
    doc.text('Status: Pending blockchain registration');
  }
  if (offer.documentHash) {
    doc.text(`SHA-256 Document Hash: ${offer.documentHash}`);
  }
  doc.moveDown(0.5);
  doc.text(`Verify at: ${verifyUrl}`);
  doc.moveDown(1);

  // Signature block
  doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(1);
  doc.fontSize(10).font('Helvetica').fillColor('#000');
  doc.text('Authorized Signatory:', { continued: false });
  doc.moveDown(2);
  doc.text('_______________________________');
  doc.text(`${company?.name || 'Employer'}`).text('Human Resources / Management');

  doc.end();

  await createAuditLog(
    req.user._id,
    req.user.email,
    'OFFER_PDF_GENERATED',
    'JobOffer',
    offer._id,
    { offerId: offer.offerId },
    req.ip
  );
});

// @route   GET /api/employer/stats
// @desc    Employer dashboard statistics
// @access  Private (Employer)
router.get('/stats', async (req, res) => {
  const employerId = req.user._id;

  const [total, draft, issued, accepted, rejected, revoked, onChain] = await Promise.all([
    JobOffer.countDocuments({ employerId }),
    JobOffer.countDocuments({ employerId, status: 'draft' }),
    JobOffer.countDocuments({ employerId, status: 'issued' }),
    JobOffer.countDocuments({ employerId, status: 'accepted' }),
    JobOffer.countDocuments({ employerId, status: 'rejected' }),
    JobOffer.countDocuments({ employerId, status: 'revoked' }),
    JobOffer.countDocuments({ employerId, onChain: true }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      total,
      draft,
      issued,
      accepted,
      rejected,
      revoked,
      onChain,
    },
  });
});

module.exports = router;
