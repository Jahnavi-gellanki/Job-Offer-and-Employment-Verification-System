const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * Generates a QR code image and saves it to outputPath
 * @param {string} data - Content to encode in QR (e.g. verification URL)
 * @param {string} outputPath - Local file path where image is saved
 * @returns {Promise<string>} Output file path
 */
const generateQRCode = async (data, outputPath) => {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const options = {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 2,
    width: 320,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  };

  await QRCode.toFile(outputPath, data, options);
  return outputPath;
};

/**
 * Generates a base64 Data URL for the given QR data
 * @param {string} data - Content to encode
 * @returns {Promise<string>} Base64 image data URL
 */
const generateQRCodeDataURL = async (data) => {
  const options = {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 320,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  };
  return await QRCode.toDataURL(data, options);
};

/**
 * Formats a canonical verification URL for a given offer ID
 * @param {string} offerId 
 * @returns {string} Full verification URL
 */
const getVerificationUrl = (offerId) => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${baseUrl}/verify?offerId=${encodeURIComponent(offerId)}`;
};

module.exports = {
  generateQRCode,
  generateQRCodeDataURL,
  getVerificationUrl,
};
