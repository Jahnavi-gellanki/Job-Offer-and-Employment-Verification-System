const { expect }  = require("chai");
const { ethers }   = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
async function latestTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

// Simulate a SHA-256 hash as bytes32 (keccak256 has same output width)
const hash = (content) => ethers.keccak256(ethers.toUtf8Bytes(content));

// BigInt-safe equal helper
const eq = (a, b) => BigInt(a) === BigInt(b);

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────
describe("JobOfferVerification", function () {
  let contract;
  let owner, employer1, employer2, candidate, verifier, stranger;

  const OFFER_ID_1 = "jov-test-offer-001";
  const OFFER_ID_2 = "jov-test-offer-002";
  const VALID_HASH  = hash("genuine-offer-letter-content");
  const WRONG_HASH  = hash("forged-letter-content");

  beforeEach(async function () {
    [owner, employer1, employer2, candidate, verifier, stranger] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("JobOfferVerification");
    contract      = await Factory.deploy();
    await contract.waitForDeployment();
  });

  // ═══════════════════════════════════════════════════════════════
  describe("1 ─ Deployment", function () {
    it("sets the deployer as owner", async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("registers owner as employer by default", async () => {
      expect(await contract.isEmployerRegistered(owner.address)).to.be.true;
    });

    it("starts with zero offers and verifications", async () => {
      expect(await contract.totalOffersRegistered()).to.equal(0);
      expect(await contract.totalVerifications()).to.equal(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("2 ─ Employer Registration", function () {
    it("allows owner to register an employer", async () => {
      await expect(contract.connect(owner).registerEmployer(employer1.address))
        .to.emit(contract, "EmployerRegistered")
        .withArgs(employer1.address, anyValue);

      expect(await contract.isEmployerRegistered(employer1.address)).to.be.true;
    });

    it("rejects registration by non-owner", async () => {
      await expect(contract.connect(stranger).registerEmployer(employer1.address))
        .to.be.revertedWith("JOV: caller is not the owner");
    });

    it("rejects zero address", async () => {
      await expect(contract.connect(owner).registerEmployer(ethers.ZeroAddress))
        .to.be.revertedWith("JOV: invalid address");
    });

    it("rejects duplicate registration", async () => {
      await contract.connect(owner).registerEmployer(employer1.address);
      await expect(contract.connect(owner).registerEmployer(employer1.address))
        .to.be.revertedWith("JOV: already registered");
    });

    it("allows owner to remove an employer", async () => {
      await contract.connect(owner).registerEmployer(employer1.address);
      await expect(contract.connect(owner).removeEmployer(employer1.address))
        .to.emit(contract, "EmployerRemoved");
      expect(await contract.isEmployerRegistered(employer1.address)).to.be.false;
    });

    it("prevents removing the owner", async () => {
      await expect(contract.connect(owner).removeEmployer(owner.address))
        .to.be.revertedWith("JOV: cannot remove owner");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("3 ─ Offer Registration", function () {
    beforeEach(async () => {
      await contract.connect(owner).registerEmployer(employer1.address);
    });

    it("registers a job offer and emits OfferRegistered", async () => {
      await expect(
        contract.connect(employer1).registerOffer(OFFER_ID_1, VALID_HASH, candidate.address)
      )
        .to.emit(contract, "OfferRegistered")
        .withArgs(OFFER_ID_1, VALID_HASH, employer1.address, anyValue);

      expect(await contract.totalOffersRegistered()).to.equal(1);
    });

    it("rejects offer from unregistered employer", async () => {
      await expect(
        contract.connect(stranger).registerOffer(OFFER_ID_1, VALID_HASH, candidate.address)
      ).to.be.revertedWith("JOV: caller is not a registered employer");
    });

    it("rejects empty offer ID", async () => {
      await expect(
        contract.connect(employer1).registerOffer("", VALID_HASH, candidate.address)
      ).to.be.revertedWith("JOV: empty offer ID");
    });

    it("rejects zero document hash", async () => {
      await expect(
        contract.connect(employer1).registerOffer(OFFER_ID_1, ethers.ZeroHash, candidate.address)
      ).to.be.revertedWith("JOV: empty document hash");
    });

    it("rejects duplicate offer ID (replay protection)", async () => {
      await contract.connect(employer1).registerOffer(OFFER_ID_1, VALID_HASH, candidate.address);
      await expect(
        contract.connect(employer1).registerOffer(OFFER_ID_1, WRONG_HASH, candidate.address)
      ).to.be.revertedWith("JOV: offer already registered");
    });

    it("stores correct metadata", async () => {
      await contract.connect(employer1).registerOffer(OFFER_ID_1, VALID_HASH, ethers.ZeroAddress);
      const [docHash, empAddr, isRevoked, issuedAt] = await contract.getOffer(OFFER_ID_1);
      expect(docHash).to.equal(VALID_HASH);
      expect(empAddr).to.equal(employer1.address);
      expect(isRevoked).to.be.false;
      expect(issuedAt).to.be.gt(0);
    });

    it("confirms offer existence", async () => {
      await contract.connect(employer1).registerOffer(OFFER_ID_1, VALID_HASH, ethers.ZeroAddress);
      expect(await contract.offerExistsCheck(OFFER_ID_1)).to.be.true;
      expect(await contract.offerExistsCheck("non-existent")).to.be.false;
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("4 ─ Offer Verification", function () {
    beforeEach(async () => {
      await contract.connect(owner).registerEmployer(employer1.address);
      await contract.connect(employer1).registerOffer(OFFER_ID_1, VALID_HASH, candidate.address);
    });

    it("returns isValid=true for correct hash", async () => {
      const [isValid, isRevoked] =
        await contract.connect(verifier).verifyOffer.staticCall(OFFER_ID_1, VALID_HASH);
      expect(isValid).to.be.true;
      expect(isRevoked).to.be.false;
    });

    it("returns isValid=false for forged/wrong hash (forgery detection)", async () => {
      const [isValid] =
        await contract.connect(verifier).verifyOffer.staticCall(OFFER_ID_1, WRONG_HASH);
      expect(isValid).to.be.false;
    });

    it("reverts for non-existent offer", async () => {
      await expect(contract.connect(verifier).verifyOffer("ghost-id", VALID_HASH))
        .to.be.revertedWith("JOV: offer does not exist");
    });

    it("emits OfferVerified event", async () => {
      await expect(contract.connect(verifier).verifyOffer(OFFER_ID_1, VALID_HASH))
        .to.emit(contract, "OfferVerified");
    });

    it("increments totalVerifications", async () => {
      await contract.connect(verifier).verifyOffer(OFFER_ID_1, VALID_HASH);
      await contract.connect(verifier).verifyOffer(OFFER_ID_1, WRONG_HASH);
      expect(await contract.totalVerifications()).to.equal(2);
    });

    it("checkHashMatch returns correct result without side effects", async () => {
      expect(await contract.checkHashMatch(OFFER_ID_1, VALID_HASH)).to.be.true;
      expect(await contract.checkHashMatch(OFFER_ID_1, WRONG_HASH)).to.be.false;
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("5 ─ Offer Revocation", function () {
    beforeEach(async () => {
      await contract.connect(owner).registerEmployer(employer1.address);
      await contract.connect(owner).registerEmployer(employer2.address);
      await contract.connect(employer1).registerOffer(OFFER_ID_1, VALID_HASH, candidate.address);
    });

    it("allows issuing employer to revoke their offer", async () => {
      await expect(contract.connect(employer1).revokeOffer(OFFER_ID_1))
        .to.emit(contract, "OfferRevoked")
        .withArgs(OFFER_ID_1, employer1.address, anyValue);
    });

    it("marks offer as revoked", async () => {
      await contract.connect(employer1).revokeOffer(OFFER_ID_1);
      const [, , isRevoked] = await contract.getOffer(OFFER_ID_1);
      expect(isRevoked).to.be.true;
    });

    it("verification fails after revocation", async () => {
      await contract.connect(employer1).revokeOffer(OFFER_ID_1);
      const [isValid, isRevoked] =
        await contract.connect(verifier).verifyOffer.staticCall(OFFER_ID_1, VALID_HASH);
      expect(isValid).to.be.false;
      expect(isRevoked).to.be.true;
    });

    it("prevents double revocation", async () => {
      await contract.connect(employer1).revokeOffer(OFFER_ID_1);
      await expect(contract.connect(employer1).revokeOffer(OFFER_ID_1))
        .to.be.revertedWith("JOV: already revoked");
    });

    it("prevents a different employer from revoking", async () => {
      await expect(contract.connect(employer2).revokeOffer(OFFER_ID_1))
        .to.be.revertedWith("JOV: not authorized to revoke");
    });

    it("prevents non-employer from revoking", async () => {
      await expect(contract.connect(stranger).revokeOffer(OFFER_ID_1))
        .to.be.revertedWith("JOV: caller is not a registered employer");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("6 ─ Employment Verification Records", function () {
    beforeEach(async () => {
      await contract.connect(owner).registerEmployer(employer1.address);
      await contract.connect(employer1).registerOffer(OFFER_ID_1, VALID_HASH, candidate.address);
    });

    it("records employment verification and emits event", async () => {
      await expect(
        contract.connect(employer1).recordEmploymentVerification(
          OFFER_ID_1, verifier.address, "Background check passed"
        )
      ).to.emit(contract, "EmploymentVerified")
        .withArgs(OFFER_ID_1, verifier.address, anyValue);
    });

    it("tracks multiple verification records", async () => {
      await contract.connect(employer1).recordEmploymentVerification(OFFER_ID_1, verifier.address, "Pass 1");
      await contract.connect(employer1).recordEmploymentVerification(OFFER_ID_1, stranger.address, "Pass 2");
      expect(await contract.getEmploymentVerificationCount(OFFER_ID_1)).to.equal(2);
    });

    it("blocks employment verification on revoked offer", async () => {
      await contract.connect(employer1).revokeOffer(OFFER_ID_1);
      await expect(
        contract.connect(employer1).recordEmploymentVerification(OFFER_ID_1, verifier.address, "")
      ).to.be.revertedWith("JOV: offer has been revoked");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("7 ─ Access Control & Ownership Transfer", function () {
    it("blocks non-owner from admin functions", async () => {
      await expect(contract.connect(stranger).registerEmployer(employer1.address))
        .to.be.revertedWith("JOV: caller is not the owner");
    });

    it("allows ownership transfer", async () => {
      await contract.connect(owner).transferOwnership(employer1.address);
      expect(await contract.owner()).to.equal(employer1.address);
    });

    it("blocks ownership transfer to zero address", async () => {
      await expect(contract.connect(owner).transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWith("JOV: invalid address");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("8 ─ End-to-End Workflow", function () {
    it("full lifecycle: register → verify → revoke → verify-fails", async () => {
      // 1. Register employer
      await contract.connect(owner).registerEmployer(employer1.address);

      // 2. Issue offer
      await contract.connect(employer1).registerOffer(OFFER_ID_2, VALID_HASH, candidate.address);
      expect(await contract.totalOffersRegistered()).to.equal(1);

      // 3. Verify valid document
      const [v1] = await contract.connect(verifier).verifyOffer.staticCall(OFFER_ID_2, VALID_HASH);
      expect(v1).to.be.true;

      // 4. Detect forged document
      const [v2] = await contract.connect(verifier).verifyOffer.staticCall(OFFER_ID_2, WRONG_HASH);
      expect(v2).to.be.false;

      // 5. Record employment check
      await contract.connect(employer1).recordEmploymentVerification(OFFER_ID_2, verifier.address, "Passed");

      // 6. Revoke offer
      await contract.connect(employer1).revokeOffer(OFFER_ID_2);

      // 7. Verify fails after revocation
      const [v3, revoked] = await contract.connect(verifier).verifyOffer.staticCall(OFFER_ID_2, VALID_HASH);
      expect(v3).to.be.false;
      expect(revoked).to.be.true;
    });
  });
});
