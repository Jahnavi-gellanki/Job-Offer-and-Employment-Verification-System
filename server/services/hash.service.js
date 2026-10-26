const crypto = require('crypto');
const fs = require('fs');

/**
 * Hash a file at the given path using SHA-256 and return hex string
 * @param {string} filePath 
 * @returns {string} 64-char SHA-256 hex string
 */
const hashFile = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  return hashBuffer(fileBuffer);
};

/**
 * Hash a Buffer using SHA-256 and return hex string
 * @param {Buffer} buffer 
 * @returns {string} 64-char SHA-256 hex string
 */
const hashBuffer = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Hash a UTF-8 string using SHA-256 and return hex string
 * @param {string} str 
 * @returns {string} 64-char SHA-256 hex string
 */
const hashString = (str) => {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
};

/**
 * Convert 64-char hex string to bytes32 format (0x-prefixed, padded to 32 bytes)
 * @param {string} hexHash 
 * @returns {string} 0x-prefixed 66-character bytes32 hex string
 */
const hexToBytes32 = (hexHash) => {
  if (!hexHash) return '0x' + '0'.repeat(64);
  let cleanHex = hexHash.trim();
  if (cleanHex.startsWith('0x') || cleanHex.startsWith('0X')) {
    cleanHex = cleanHex.slice(2);
  }
  // Pad or slice to exactly 64 hex characters (32 bytes)
  cleanHex = cleanHex.padStart(64, '0').slice(0, 64);
  return '0x' + cleanHex;
};

/**
 * Convert bytes32 format back to clean hex string without 0x prefix
 * @param {string} bytes32 
 * @returns {string} 64-character hex string
 */
const bytes32ToHex = (bytes32) => {
  if (!bytes32) return '';
  let clean = String(bytes32).trim();
  if (clean.startsWith('0x') || clean.startsWith('0X')) {
    clean = clean.slice(2);
  }
  return clean.toLowerCase();
};

module.exports = {
  hashFile,
  hashBuffer,
  hashString,
  hexToBytes32,
  bytes32ToHex,
};
