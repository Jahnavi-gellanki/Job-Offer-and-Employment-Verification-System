/**
 * Verification API Tests
 * Tests: valid offer, revoked offer, missing offer, hash mismatch
 * Uses supertest against the Express app with a real MongoDB test DB.
 * Blockchain calls are mocked so tests run without a live Hardhat node.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const JobOffer = require('../models/JobOffer');
const User = require('../models/User');
const Company = require('../models/Company');
const VerificationLog = require('../models/VerificationLog');

// ── Mock blockchain service so tests never need a live node ──────────────────
jest.mock('../services/blockchain.service', () => ({
  getOfferOnChain: jest.fn(),
  verifyOffer: jest.fn(),
  registerOffer: jest.fn(),
  registerEmployer: jest.fn(),
  revokeOffer: jest.fn(),
  recordEmploymentVerification: jest.fn(),
  isEmployerRegistered: jest.fn(),
  offerExistsCheck: jest.fn(),
  checkHashMatch: jest.fn(),
  getContractStats: jest.fn().mockResolvedValue({
    totalOffersRegistered: 0,
    totalVerifications: 0,
    contractOwner: '0x0000000000000000000000000000000000000000',
  }),
}));

const blockchainService = require('../services/blockchain.service');

// ── Test constants ────────────────────────────────────────────────────────────
const VALID_HASH   = 'a'.repeat(64);   // 64-char hex
const WRONG_HASH   = 'b'.repeat(64);
const OFFER_ID     = 'test-offer-uuid-001';
const REVOKED_ID   = 'test-offer-uuid-revoked';
const MISSING_ID   = 'test-offer-uuid-does-not-exist';

const TEST_DB = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/blockchain_job_verification_test';

// ── Setup / Teardown ──────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

beforeEach(async () => {
  // Clean relevant collections before each test
  await Promise.all([
    JobOffer.deleteMany({}),
    VerificationLog.deleteMany({}),
    User.deleteMany({ email: /test-verify/ }),
    Company.deleteMany({ registrationNumber: /TEST-VERIFY/ }),
  ]);

  // Create a test employer user + company
  const employer = await User.create({
    name: 'Test Employer',
    email: 'test-verify-employer@test.com',
    password: 'Password123',
    role: 'employer',
    isActive: true,
  });

  const company = await Company.create({
    name: 'Test Corp',
    registrationNumber: 'TEST-VERIFY-001',
    industry: 'Technology',
    adminUserId: employer._id,
    verificationStatus: 'approved',
  });

  // Seed a valid on-chain offer
  await JobOffer.create({
    offerId: OFFER_ID,
    employerId: employer._id,
    companyId: company._id,
    candidateName: 'Jane Doe',
    candidateEmail: 'jane@test.com',
    jobTitle: 'Software Engineer',
    offerDate: new Date(),
    status: 'issued',
    onChain: true,
    documentHash: VALID_HASH,
    blockchainTxHash: '0x' + 'f'.repeat(64),
    blockNumber: 5,
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  });

  // Seed a revoked offer
  await JobOffer.create({
    offerId: REVOKED_ID,
    employerId: employer._id,
    companyId: company._id,
    candidateName: 'Bob Smith',
    candidateEmail: 'bob@test.com',
    jobTitle: 'DevOps Engineer',
    offerDate: new Date(),
    status: 'revoked',
    onChain: true,
    documentHash: VALID_HASH,
    blockchainTxHash: '0x' + 'e'.repeat(64),
    blockNumber: 6,
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. GET /api/verify/offer/:offerId — Verify by ID
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /api/verify/offer/:offerId', () => {

  it('returns valid result for an active on-chain offer', async () => {
    blockchainService.getOfferOnChain.mockResolvedValueOnce({
      documentHash: VALID_HASH,
      employerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      isRevoked: false,
      issuedAt: Math.floor(Date.now() / 1000),
      revokedAt: 0,
    });

    const res = await request(app).get(`/api/verify/offer/${OFFER_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result).toBe('valid');
    expect(res.body.isValid).toBe(true);
    expect(res.body.isRevoked).toBe(false);
    expect(res.body.offer.offerId).toBe(OFFER_ID);
  });

  it('returns revoked result for a revoked offer', async () => {
    blockchainService.getOfferOnChain.mockResolvedValueOnce({
      documentHash: VALID_HASH,
      employerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      isRevoked: true,
      issuedAt: Math.floor(Date.now() / 1000),
      revokedAt: Math.floor(Date.now() / 1000),
    });

    const res = await request(app).get(`/api/verify/offer/${REVOKED_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('revoked');
    expect(res.body.isRevoked).toBe(true);
    expect(res.body.isValid).toBe(false);
  });

  it('returns not_found for a non-existent offer ID', async () => {
    const res = await request(app).get(`/api/verify/offer/${MISSING_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.result).toBe('not_found');
  });

  it('logs every verification attempt to VerificationLog', async () => {
    blockchainService.getOfferOnChain.mockResolvedValueOnce({ isRevoked: false });

    await request(app).get(`/api/verify/offer/${OFFER_ID}`);

    const log = await VerificationLog.findOne({ offerId: OFFER_ID });
    expect(log).not.toBeNull();
    expect(log.verificationType).toBe('id');
    expect(log.result).toBe('valid');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. POST /api/verify/hash — Verify by hash
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/verify/hash', () => {

  it('returns valid when hash matches on-chain record', async () => {
    blockchainService.verifyOffer.mockResolvedValueOnce({
      isValid: true,
      isRevoked: false,
      timestamp: Math.floor(Date.now() / 1000),
    });

    const res = await request(app)
      .post('/api/verify/hash')
      .send({ offerId: OFFER_ID, documentHash: VALID_HASH });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('valid');
    expect(res.body.isValid).toBe(true);
  });

  it('returns invalid when hash does NOT match (forgery detection)', async () => {
    blockchainService.verifyOffer.mockResolvedValueOnce({
      isValid: false,
      isRevoked: false,
      timestamp: Math.floor(Date.now() / 1000),
    });

    const res = await request(app)
      .post('/api/verify/hash')
      .send({ offerId: OFFER_ID, documentHash: WRONG_HASH });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('invalid');
    expect(res.body.isValid).toBe(false);
  });

  it('returns revoked when offer is revoked even with correct hash', async () => {
    blockchainService.verifyOffer.mockResolvedValueOnce({
      isValid: false,
      isRevoked: true,
      timestamp: Math.floor(Date.now() / 1000),
    });

    const res = await request(app)
      .post('/api/verify/hash')
      .send({ offerId: REVOKED_ID, documentHash: VALID_HASH });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('revoked');
    expect(res.body.isRevoked).toBe(true);
  });

  it('returns not_found for missing offer ID', async () => {
    const res = await request(app)
      .post('/api/verify/hash')
      .send({ offerId: MISSING_ID, documentHash: VALID_HASH });

    expect(res.status).toBe(404);
    expect(res.body.result).toBe('not_found');
  });

  it('falls back to DB comparison when blockchain call fails', async () => {
    blockchainService.verifyOffer.mockRejectedValueOnce(new Error('RPC timeout'));

    const res = await request(app)
      .post('/api/verify/hash')
      .send({ offerId: OFFER_ID, documentHash: VALID_HASH });

    expect(res.status).toBe(200);
    // DB hash matches → valid
    expect(res.body.result).toBe('valid');
  });

  it('falls back to DB and returns invalid when hash mismatches and blockchain fails', async () => {
    blockchainService.verifyOffer.mockRejectedValueOnce(new Error('RPC timeout'));

    const res = await request(app)
      .post('/api/verify/hash')
      .send({ offerId: OFFER_ID, documentHash: WRONG_HASH });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('invalid');
  });

  it('returns 400 when offerId is missing', async () => {
    const res = await request(app)
      .post('/api/verify/hash')
      .send({ documentHash: VALID_HASH });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when documentHash is missing', async () => {
    const res = await request(app)
      .post('/api/verify/hash')
      .send({ offerId: OFFER_ID });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. POST /api/verify/employment/:offerId — Employment verification
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/verify/employment/:offerId', () => {

  it('records employment verification on blockchain for valid offer', async () => {
    blockchainService.recordEmploymentVerification.mockResolvedValueOnce({
      txHash: '0x' + 'a'.repeat(64),
      blockNumber: 10,
    });

    const res = await request(app)
      .post(`/api/verify/employment/${OFFER_ID}`)
      .send({
        verifierName: 'HR Corp',
        verifierOrganization: 'Acme Recruiting',
        purpose: 'Background check',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.txHash).toBeDefined();
  });

  it('rejects employment verification for a revoked offer', async () => {
    const res = await request(app)
      .post(`/api/verify/employment/${REVOKED_ID}`)
      .send({ verifierName: 'HR Corp', verifierOrganization: 'Acme' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects employment verification for a non-existent offer', async () => {
    const res = await request(app)
      .post(`/api/verify/employment/${MISSING_ID}`)
      .send({ verifierName: 'HR Corp', verifierOrganization: 'Acme' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Health check
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /api/health', () => {
  it('returns 200 OK with database status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.database).toBe('connected');
  });
});
