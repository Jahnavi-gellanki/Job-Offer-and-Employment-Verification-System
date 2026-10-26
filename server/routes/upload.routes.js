const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');
const { createAuditLog } = require('../middleware/audit.middleware');
const hashService = require('../services/hash.service');

const router = express.Router();

// @route   POST /api/upload/document
// @desc    Upload an offer letter PDF or image, calculate and return SHA-256 hash
// @access  Private (Authenticated users)
router.post('/document', protect, uploadSingle, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No document file was uploaded. Please provide a PDF, PNG, JPG, or JPEG file.',
    });
  }

  try {
    const fileHash = hashService.hashFile(req.file.path);
    const publicFilePath = `/uploads/${req.file.filename}`;

    await createAuditLog(
      req.user._id,
      req.user.email,
      'DOCUMENT_UPLOADED',
      'Upload',
      req.file.filename,
      {
        originalName: req.file.originalname,
        size: req.file.size,
        hash: fileHash,
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Document uploaded and hashed successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      hash: fileHash,
      filePath: publicFilePath,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err) {
    console.error('Document upload hashing error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process document: ' + err.message,
    });
  }
});

module.exports = router;
