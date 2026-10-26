const { ethers } = require('ethers');
const { hexToBytes32, bytes32ToHex } = require('./hash.service');

const CONTRACT_ABI = [
  "function owner() view returns (address)",
  "function totalOffersRegistered() view returns (uint256)",
  "function totalVerifications() view returns (uint256)",
  "function isEmployerRegistered(address employer) view returns (bool)",
  "function offerExistsCheck(string memory offerId) view returns (bool)",
  "function getOffer(string memory offerId) view returns (bytes32 documentHash, address employerAddress, bool isRevoked, uint256 issuedAt, uint256 revokedAt)",
  "function checkHashMatch(string memory offerId, bytes32 documentHash) view returns (bool)",
  "function getEmploymentVerificationCount(string memory offerId) view returns (uint256)",
  "function registerEmployer(address employer) external",
  "function removeEmployer(address employer) external",
  "function registerOffer(string memory offerId, bytes32 documentHash, address candidateAddress) external",
  "function revokeOffer(string memory offerId) external",
  "function verifyOffer(string memory offerId, bytes32 documentHash) external returns (bool isValid, bool isRevoked, uint256 timestamp)",
  "function recordEmploymentVerification(string memory offerId, address verifierAddress, string memory notes) external",
  "function transferOwnership(address newOwner) external",
  "event EmployerRegistered(address indexed employer, uint256 timestamp)",
  "event EmployerRemoved(address indexed employer, uint256 timestamp)",
  "event OfferRegistered(string indexed offerId, bytes32 documentHash, address indexed employer, uint256 timestamp)",
  "event OfferVerified(string indexed offerId, address indexed verifier, bool isValid, uint256 timestamp)",
  "event OfferRevoked(string indexed offerId, address indexed employer, uint256 timestamp)",
  "event EmploymentVerified(string indexed offerId, address indexed verifier, uint256 timestamp)"
];

class BlockchainService {
  constructor() {
    this.rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
    this.abi = CONTRACT_ABI;

    this.provider = null;
    this.wallet = null;
    this.contract = null;

    this._initialize();
  }

  _initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      if (this.ownerPrivateKey) {
        this.wallet = new ethers.Wallet(this.ownerPrivateKey, this.provider);
        if (this.contractAddress) {
          this.contract = new ethers.Contract(this.contractAddress, this.abi, this.wallet);
        }
      } else if (this.contractAddress) {
        this.contract = new ethers.Contract(this.contractAddress, this.abi, this.provider);
      }
    } catch (err) {
      console.warn('BlockchainService initialization warning:', err.message);
    }
  }

  _getContract() {
    if (!this.contract) {
      this._initialize();
    }
    if (!this.contract) {
      throw new Error(
        'Smart contract instance is not available. Please verify CONTRACT_ADDRESS and RPC_URL in environment variables.'
      );
    }
    return this.contract;
  }

  /**
   * Register an employer wallet address on the blockchain
   * @param {string} employerAddress 
   * @returns {Promise<{ txHash: string, blockNumber: number }>}
   */
  async registerEmployer(employerAddress) {
    const contract = this._getContract();
    const isAlready = await contract.isEmployerRegistered(employerAddress);
    if (isAlready) {
      return { txHash: null, alreadyRegistered: true };
    }
    const tx = await contract.registerEmployer(employerAddress);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      alreadyRegistered: false,
    };
  }

  /**
   * Register a job offer hash on chain
   * @param {string} offerId 
   * @param {string} documentHashHex 
   * @param {string} candidateAddress 
   * @returns {Promise<{ txHash: string, blockNumber: number, contractAddress: string }>}
   */
  async registerOffer(offerId, documentHashHex, candidateAddress) {
    const contract = this._getContract();
    const bytes32Hash = hexToBytes32(documentHashHex);
    const targetCandidate = candidateAddress && ethers.isAddress(candidateAddress)
      ? candidateAddress
      : ethers.ZeroAddress;

    const tx = await contract.registerOffer(offerId, bytes32Hash, targetCandidate);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      contractAddress: this.contractAddress,
    };
  }

  /**
   * Verify an offer by offerId and document hash (emits event on chain via staticCall / transaction)
   * @param {string} offerId 
   * @param {string} documentHashHex 
   * @returns {Promise<{ isValid: boolean, isRevoked: boolean, timestamp: number }>}
   */
  async verifyOffer(offerId, documentHashHex) {
    const contract = this._getContract();
    const bytes32Hash = hexToBytes32(documentHashHex);

    // Use staticCall to simulate the verification call without spending gas
    const result = await contract.verifyOffer.staticCall(offerId, bytes32Hash);
    return {
      isValid: Boolean(result[0]),
      isRevoked: Boolean(result[1]),
      timestamp: Number(result[2]),
    };
  }

  /**
   * Pure read view check if hash matches
   * @param {string} offerId 
   * @param {string} documentHashHex 
   * @returns {Promise<boolean>}
   */
  async checkHashMatch(offerId, documentHashHex) {
    const contract = this._getContract();
    const bytes32Hash = hexToBytes32(documentHashHex);
    return await contract.checkHashMatch(offerId, bytes32Hash);
  }

  /**
   * Check if offer exists on chain
   * @param {string} offerId 
   * @returns {Promise<boolean>}
   */
  async offerExistsCheck(offerId) {
    const contract = this._getContract();
    return await contract.offerExistsCheck(offerId);
  }

  /**
   * Revoke an offer on chain
   * @param {string} offerId 
   * @returns {Promise<{ txHash: string, blockNumber: number }>}
   */
  async revokeOffer(offerId) {
    const contract = this._getContract();
    const tx = await contract.revokeOffer(offerId);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  /**
   * Retrieve on-chain offer metadata
   * @param {string} offerId 
   * @returns {Promise<{ documentHash: string, employerAddress: string, isRevoked: boolean, issuedAt: number, revokedAt: number }>}
   */
  async getOfferOnChain(offerId) {
    const contract = this._getContract();
    const result = await contract.getOffer(offerId);
    return {
      documentHash: bytes32ToHex(result[0]),
      documentHashBytes32: result[0],
      employerAddress: result[1],
      isRevoked: Boolean(result[2]),
      issuedAt: Number(result[3]),
      revokedAt: Number(result[4]),
    };
  }

  /**
   * Record employment verification on chain
   * @param {string} offerId 
   * @param {string} verifierAddress 
   * @param {string} notes 
   * @returns {Promise<{ txHash: string, blockNumber: number }>}
   */
  async recordEmploymentVerification(offerId, verifierAddress, notes = '') {
    const contract = this._getContract();
    const verifier = verifierAddress && ethers.isAddress(verifierAddress)
      ? verifierAddress
      : ethers.ZeroAddress;

    const tx = await contract.recordEmploymentVerification(offerId, verifier, notes);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  /**
   * Check if employer is registered on chain
   * @param {string} employerAddress 
   * @returns {Promise<boolean>}
   */
  async isEmployerRegistered(employerAddress) {
    const contract = this._getContract();
    return await contract.isEmployerRegistered(employerAddress);
  }

  /**
   * Get platform stats from smart contract
   * @returns {Promise<{ totalOffersRegistered: number, totalVerifications: number, contractOwner: string }>}
   */
  async getContractStats() {
    try {
      const contract = this._getContract();
      const [totalOffers, totalVerifs, owner] = await Promise.all([
        contract.totalOffersRegistered(),
        contract.totalVerifications(),
        contract.owner(),
      ]);
      return {
        totalOffersRegistered: Number(totalOffers),
        totalVerifications: Number(totalVerifs),
        contractOwner: owner,
      };
    } catch (err) {
      console.warn('Unable to retrieve contract stats:', err.message);
      return {
        totalOffersRegistered: 0,
        totalVerifications: 0,
        contractOwner: null,
      };
    }
  }
}

// Export singleton instance
module.exports = new BlockchainService();
